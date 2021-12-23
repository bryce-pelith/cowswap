import React, { useState, useCallback, useEffect, useMemo } from 'react'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'
import ERC20_ABI from 'abis/erc20.json'
// import { TokenList } from '@uniswap/token-lists'
import { TokenList } from './tokens'
import { PieChart, Pie, Sector } from 'recharts'

const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545')

const App = () => {
  const [connected, setConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [balance, setBalance] = useState<{ [key: string]: number }>({})
  // pie chart
  const [activeIndex, setActiveIndex] = useState(0)
  const onPieEnter = useCallback(
    (_, index) => {
      setActiveIndex(index)
    },
    [setActiveIndex]
  )

  const rate = useMemo(() => {
    // fetch token price
    const rateMap: { [key: string]: number } = { HAKKA: 1 }
    fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${TokenList.map(({ id }) => {
        return id
      }).join(',')}&vs_currencies=twd`
    )
      .then((response) => response.json())
      .then((price) => {
        TokenList.map(({ id, symbol }) => (rateMap[symbol] = price[id].twd / price['hakka-finance'].twd))
      })
    return rateMap
  }, [])

  useEffect(() => {
    if (!walletAddress) return
    const newBalance: { [key: string]: number } = { ETH: 0 }
    web3.eth.getBalance(walletAddress).then((balance) => {
      newBalance.ETH = parseFloat(balance) / 10 ** 18
    })
    // fetch token balance
    Promise.all(
      TokenList.filter(({ symbol }) => symbol !== 'ETH').map(({ symbol, address, decimals }) => {
        return new web3.eth.Contract(ERC20_ABI as AbiItem[], address).methods
          .balanceOf(walletAddress)
          .call()
          .then((amount: number) => {
            newBalance[symbol] = amount / 10 ** (decimals || 0)
          })
      })
    ).then(() => {
      setBalance(newBalance)
    })
  }, [walletAddress])

  const totalValue = useMemo(() => {
    return TokenList.filter(({ symbol }) => !!balance[symbol] && !!rate[symbol])
      .map(({ symbol }) => balance[symbol] * rate[symbol])
      .reduce((a, b) => a + b, 0)
  }, [balance, rate])

  const chartValue = useMemo(() => {
    return TokenList.filter(({ symbol }) => !!balance[symbol] && !!rate[symbol])
      .map(({ name, symbol }) => {
        return { name, symbol, value: balance[symbol] * rate[symbol] }
      })
      .sort((t0, t1) => t1.value - t0.value)
  }, [balance, rate])

  const connectMetaMask = useCallback(() => {
    web3.givenProvider.request({ method: 'eth_requestAccounts' }).then(() => {
      setConnected(true)
      web3.eth
        .getAccounts()
        .then((accounts) => setWalletAddress('0xc1f9bb72216e5ecdc97e248f65e14df1fe46600a' || accounts[0]))
    })
  }, [])

  return (
    <>
      <button className="w-48 text-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
        <div
          role="button"
          onClick={() => {
            connectMetaMask()
          }}
          onKeyDown={() => {
            connectMetaMask()
          }}
          tabIndex={0}
        >
          {connected ? `${walletAddress.substring(0, 10)}...${walletAddress.substring(36, 42)}` : 'connect MetaMask'}
        </div>
      </button>
      <div>
        {connected &&
          TokenList.filter(({ symbol }) => !!balance[symbol])
            .sort((t0, t1) => balance[t1.symbol] * rate[t1.symbol] - balance[t0.symbol] * rate[t0.symbol])
            .map((token) => (
              <AltToken
                key={token.id}
                token={token}
                balance={balance[token.symbol]}
                value={balance[token.symbol] * rate[token.symbol]}
              />
            ))}
      </div>
      {connected && <div className="py-4">Total Assets: {totalValue.toFixed(2)} HAKKA</div>}
      {connected && !!chartValue.length && (
        <PieChart width={1000} height={400}>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartValue}
            cx={500}
            cy={200}
            innerRadius={100}
            outerRadius={160}
            fill="rgb(16,185,129)"
            dataKey="value"
            onMouseEnter={onPieEnter}
          />
        </PieChart>
      )}
    </>
  )
}

type AltTokenProps = { token: { [key: string]: string | number | undefined }; balance: number; value: number }

const AltToken = ({ token, balance, value }: AltTokenProps) => {
  const { name, symbol, logoURI } = token
  return balance > 0 ? (
    <div className="flex flex-row p-1">
      <div>
        <img src={logoURI as string} alt={symbol as string} className="w-6 mx-1"></img>
      </div>
      <div className="w-64">{name}</div>
      <div className="w-64">{balance}</div>
      <div>~=</div>
      <div className="w-64 text-right">{value.toFixed(2)} HAKKA</div>
    </div>
  ) : null
}

type activeShapeProps = {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  fill: string
  payload: { name: string; symbol: string }
  percent: number
  value: number
}

const renderActiveShape = (props: activeShapeProps) => {
  const RADIAN = Math.PI / 180
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 10) * cos
  const sy = cy + (outerRadius + 10) * sin
  const mx = cx + (outerRadius + 30) * cos
  const my = cy + (outerRadius + 30) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 22
  const ey = my
  const textAnchor = cos >= 0 ? 'start' : 'end'

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >{`${value} ${payload.symbol}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  )
}

export default App
