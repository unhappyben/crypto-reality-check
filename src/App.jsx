import React from 'react'
import { useState, useRef } from 'react'
import { toPng } from 'html-to-image'
import './index.css'
import catHappy from './assets/cat-happy.png'
import catSad from './assets/cat-sad.png'


const COMPARISON_TOKENS = ['bitcoin', 'ethereum', 'solana', 'fartcoin']

export default function App() {
  const [date, setDate] = useState('')
  const [amountUSD, setAmountUSD] = useState(null)
  const [yourToken, setYourToken] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const resultRef = useRef(null)

  const tokenMap = {
    eur: 'euro-coin',
    eurc: 'euro-coin',
    gbp: 'monerium-gbp-emoney',
    gbpc: 'monerium-gbp-emoney',
  }
  const normalizedToken = tokenMap[yourToken?.toLowerCase()] || yourToken
  const baseCatURL = 'https://raw.githubusercontent.com/unhappyben/crypto-reality-check/main/public/';


  const fetchHistoricalPrice = async (token, timestamp) => {
    const url = `https://coins.llama.fi/prices/historical/${timestamp}/coingecko:${token}`
    try {
      const response = await fetch(url)
      const data = await response.json()
      return data.coins[`coingecko:${token}`]?.price ?? null
    } catch (err) {
      return null
    }
  }

  const fetchRealityCheck = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    if (!date) {
      setError('Please choose a date.')
      setLoading(false)
      return
    }

    const timestamp = Math.floor(new Date(date).getTime() / 1000)
    const allTokens = [normalizedToken, ...COMPARISON_TOKENS]
    const historicalPrices = {}
    for (const token of allTokens) {
      historicalPrices[token] = await fetchHistoricalPrice(token, timestamp)
    }

    const currentUrl = `https://coins.llama.fi/prices/current/${allTokens
      .map((t) => `coingecko:${t}`)
      .join(',')}`
    const currentRes = await fetch(currentUrl)
    const currentData = await currentRes.json()

    const worthToday = {}
    for (const token of allTokens) {
      const priceThen = historicalPrices[token]
      const priceNow = currentData.coins[`coingecko:${token}`]?.price
      if (priceThen && priceNow) {
        const amountOfToken = amountUSD / priceThen
        const currentValue = amountOfToken * priceNow
        worthToday[token] = currentValue.toFixed(2)
      } else {
        worthToday[token] = 'N/A'
      }
    }

    setResult(worthToday)
    setLoading(false)
  }

  const handleDownload = () => {
    if (!resultRef.current) return
    toPng(resultRef.current, { pixelRatio: 2 }).then((dataUrl) => {
      const link = document.createElement('a')
      link.download = `crypto-reality-check-${yourToken}.png`
      link.href = dataUrl
      link.click()
    })
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono px-4 py-10">
      <div className="max-w-xl mx-auto bg-zinc-900 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-8 tracking-wide text-white/90">
          Crypto Reality Check
        </h1>

        <div className="space-y-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded text-white"
          />
          <input
            type="number"
            placeholder="Amount in USD"
            value={amountUSD || ''}
            onChange={(e) => setAmountUSD(e.target.value)}
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded text-white"
          />
          <input
            type="text"
            value={yourToken || ''}
            onChange={(e) => setYourToken(e.target.value.toLowerCase())}
            placeholder="Your token (e.g. pendle)"
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded text-white uppercase tracking-widest"
          />
          <p className="text-xs text-zinc-400 italic">
            Please use full token name (e.g., <strong>ethereum</strong> not <strong>ETH</strong>)
          </p>
          <button
            onClick={fetchRealityCheck}
            className="w-full bg-white text-black font-semibold py-3 rounded hover:bg-zinc-200 transition"
            disabled={loading}
          >
            {loading ? 'Working...' : 'Reality Check'}
          </button>
        </div>

        {error && <div className="text-red-400 text-sm mt-4">{error}</div>}

        {result && result[normalizedToken] && (
          <div
            ref={resultRef}
            className="min-h-fit space-y-6 text-white/80 text-sm bg-zinc-800 p-10 rounded-xl shadow relative"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <p className="text-white text-base">
                  You bought{' '}
                  <span className="font-bold text-white">${amountUSD}</span> of{' '}
                  <span className="uppercase text-green-400">
                    {yourToken}
                  </span>{' '}
                  on <span className="text-white">{date}</span>
                </p>

                <p
                  className={`${
                    parseFloat(result[normalizedToken]) >= parseFloat(amountUSD)
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  You now have ${result[normalizedToken]} of{' '}
                  {yourToken.toUpperCase()} 👀
                </p>

                <p
                  className={`${
                    parseFloat(result[normalizedToken]) >= parseFloat(amountUSD)
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  You’ve{' '}
                  {parseFloat(result[yourToken]) >=
                  parseFloat(amountUSD)
                    ? 'gained'
                    : 'lost'}{' '}
                  $
                  {Math.abs(
                    parseFloat(amountUSD) -
                      parseFloat(result[normalizedToken])
                  ).toFixed(2)}{' '}
                  since your investment{' '}
                  {parseFloat(result[normalizedToken]) >= parseFloat(amountUSD)
                    ? '💰'
                    : '😢'}
                </p>
              </div>

              <div className="w-24 shrink-0">
              <img
                src={
                  parseFloat(result[normalizedToken]) >= parseFloat(amountUSD)
                    ? catHappy
                    : catSad
                }
              />
              </div>
            </div>

            <div className="pt-4 space-y-3 text-sm">
              {COMPARISON_TOKENS.map((t) => {
                const altValue = parseFloat(result[t])
                const yourValue = parseFloat(result[normalizedToken])
                const diff = altValue - yourValue
                const isUp = diff > 0

                return (
                  <div
                    key={t}
                    className="flex justify-between items-start border-b border-zinc-700 pb-2"
                  >
                    <span className="text-zinc-300">
                      If you bought <span className="font-semibold">{t}</span>
                    </span>
                    <span className="text-right">
                      <div className="text-white font-mono">
                        ${altValue.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs ${
                          isUp ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {isUp ? '↑' : '↓'} {Math.abs(diff).toFixed(2)}
                      </div>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {result && (
          <div className="text-center mt-6">
            <button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            >
              Download Card
            </button>

            <p className="mt-4 text-sm text-white/50 text-center">
              Made by{' '}
              <a
                href="https://twitter.com/unhappyben"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                unhappyben
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
