import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Currency } from '@uniswap/sdk-core'
import { useActiveWeb3React } from '../../../hooks/web3'
import { useTokenBalances, useCurrencyBalances } from '../../../state/wallet/hooks'
import { GpEther as ExtendedEther } from 'constants/tokens'
import CurrencyLogo from 'components/CurrencyLogo'
import { isEmpty, formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { PieChart, Pie, Sector } from 'recharts'
import { TYPE, ButtonText, IconWrapper } from 'theme'
import { Edit } from 'react-feather'
import Row, { RowBetween, RowFixed } from 'components/Row'
import CurrencySearchModal from '../../../components/SearchModal/CurrencySearchModal'
import { useAllTokens } from '@src/hooks/Tokens'

const HAKKA = '0x0E29e5AbbB5FD88e28b2d355774e73BD47dE3bcd'

const App = () => {
  const { account, chainId } = useActiveWeb3React()

  const ether = useMemo(() => chainId && ExtendedEther.onChain(chainId), [chainId])
  const allTokens = useAllTokens()
  const tokens = useMemo(() => Object.values(allTokens), [])
  const currencies = useMemo(() => {
    return [ether as Currency, ...tokens]
  }, [ether, tokens])

  const balances = useCurrencyBalances(account, currencies)
  const tokenBalances = useTokenBalances(account, tokens)

  const [prices, setPrices] = useState<{ [key: string]: number }>({})

  // pie chart
  // const [activeIndex, setActiveIndex] = useState(0)
  // const onPieEnter = useCallback(
  //   (_, index) => {
  //     setActiveIndex(index)
  //   },
  //   [setActiveIndex]
  // )

  return (
    <>
      {balances
        .filter((amount) => !isEmpty(amount))
        .map((amount: any) => {
          const address: string = amount.currency.address ?? 'ETH'
          return (
            <CurrencyRow
              key={address}
              id={address}
              currency={amount.currency}
              balance={formatCurrencyAmount(amount, 4, address === HAKKA ? 0 : undefined)}
              // value={''}
              value={((parseFloat(amount.toExact()) * prices[address]) / prices.HAKKA).toFixed(0)}
            />
          )
        })}
      {/* <div className="py-4">Total Assets: {totalValue.toFixed(2)} HAKKA</div> */}
      {/* <PieChart width={1000} height={400}>
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
      </PieChart> */}
    </>
  )
}

const CurrencyRow = ({
  id,
  currency,
  balance,
  value,
}: {
  id: string
  currency: Currency
  balance: string
  value: string
}) => {
  // const {
  //   v2Trade,
  //   // v3TradeState: { trade: v3Trade, state: v3TradeState },
  //   // toggledTrade: trade,
  //   allowedSlippage,
  //   currencyBalances,
  //   parsedAmount,
  //   currencies,
  //   inputError: swapInputError,
  // } = useDerivedSwapInfo(/* toggledVersion */)

  // logTradeDetails(v2Trade, allowedSlippage)

  return (
    <>
      <div className="flex flex-row p-1">
        <CurrencyLogo style={{ marginRight: '0.5rem' }} currency={currency} size={'24px'} />
        <div className="w-64">{currency.name}</div>
        <div className="w-24">{balance}</div>
        <div className="w-16 text-right">{currency.symbol}</div>
        <div className="w-16 text-right">~=</div>
        <div className="w-64 text-right">{value} HAKKA</div>
        <div className="w-16 text-right">
          <a href={`#/swap/${id}`}>Sell</a>
        </div>
      </div>
    </>
  )
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
