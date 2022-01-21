import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
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
import { Repeat } from 'react-feather'

const HAKKA = '0x0E29e5AbbB5FD88e28b2d355774e73BD47dE3bcd'

const App = () => {
  const { account, chainId } = useActiveWeb3React()

  const ether = useMemo(() => chainId && ExtendedEther.onChain(chainId), [chainId])
  const allTokens = useAllTokens()
  const tokens = useMemo(() => Object.values(allTokens), [allTokens])
  const currencies = useMemo(() => {
    return [ether as Currency, ...tokens]
  }, [ether, tokens])

  const balances = useCurrencyBalances(account as string, currencies)
  const tokenBalances = useTokenBalances(account as string, tokens)

  const [prices, setPrices] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    if (prices.ETH && prices.HAKKA) return
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,hakka-finance&vs_currencies=twd')
      .then((response) => response.json())
      .then((price) => {
        setPrices({ ...prices, ETH: price.ethereum.twd, HAKKA: price['hakka-finance'].twd })
      })
  }, [])
  useEffect(() => {
    if (!tokens.length || !prices.HAKKA) return
    const addresses = tokens
        .filter(({ address }) => !isEmpty(tokenBalances[address]) && !prices[address])
        .map(({ address }) => address)
      .join(',')
    if (!addresses) return
    fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?vs_currencies=twd&contract_addresses=${addresses}`
    )
      .then((response) => response.json())
      .then((price) => {
        if (!Object.keys(price).length) return
        const tokenPrices: { [key: string]: number } = {}
        tokens
          .filter(({ address }) => !isEmpty(tokenBalances[address]) && !prices[address])
          .map(({ address }) => (tokenPrices[address] = price[address.toLowerCase()]?.twd))
        setPrices({ ...prices, ...tokenPrices })
      })
  }, [tokens, tokenBalances])

  const formatValue = (amount: CurrencyAmount<Currency>, tokenPrice: number, basePrice: number, fixed = 0): string => {
    return tokenPrice ? ((parseFloat(amount.toExact()) * tokenPrice) / basePrice).toFixed(fixed) : '-'
  }

  const compareValue = (lhs: CurrencyAmount<Currency> | undefined, rhs: CurrencyAmount<Currency> | undefined) => {
    const price = (amount: any) => prices[amount.currency.address ?? 'ETH'] ?? 0
    const value = (amount: any) => parseFloat(amount.toExact()) * price(amount)
    return value(rhs) - value(lhs)
  }

  // pie chart
  // const [activeIndex, setActiveIndex] = useState(0)
  // const onPieEnter = useCallback(
  //   (_, index) => {
  //     setActiveIndex(index)
  //   },
  //   [setActiveIndex]
  // )

  const [modalOpen, setModalOpen] = useState(false)
  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  return (
    <>
      {balances
        .filter((amount) => !isEmpty(amount))
        .sort(compareValue)
        .map((amount: any) => {
          const address: string = amount.currency.address ?? 'ETH'
          return (
            <CurrencyRow
              key={address}
              id={address}
              currency={amount.currency}
              balance={formatCurrencyAmount(amount, 4, address === HAKKA ? 0 : undefined)}
              value={formatValue(amount, prices[address], prices.HAKKA)}
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
      <CurrencySearchModal
        isOpen={modalOpen}
        isManage={true}
        onDismiss={handleDismissSearch}
        onCurrencySelect={() => {
          setModalOpen(true)
        }}
      />
      <Row justify="center">
        <ButtonText
          onClick={() => {
            setModalOpen(true)
          }}
          className="list-token-manage-button"
        >
          <RowFixed>
            <IconWrapper size="16px" marginRight="6px">
              <Edit />
            </IconWrapper>
            <TYPE.main>Manage Token Lists</TYPE.main>
          </RowFixed>
        </ButtonText>
      </Row>
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
      <div className="flex flex-row items-center pl-6 py-4 m-1 border-2 border-teal-600 rounded-md bg-gradient-to-r from-green-800 via-emerald-600 to-teal-800 opacity-90 hover:opacity-100">
        <CurrencyLogo currency={currency} size={'32px'} />
        <div className="w-64 pl-4 font-semibold">{currency.name}</div>
        <div className="w-32 text-right">
          <div className="text-lg">{balance}</div>
          <div className="text-xs">{currency.symbol}</div>
        </div>
        <div className="w-24 text-right text-lg">≈</div>
        <div className="w-32 text-right">
          <div className="text-lg">{value}</div>
          <div className="text-xs">HAKKA</div>
        </div>
        <div className="w-16 ml-12 flex flex-row items-center">
          {id !== HAKKA ? (
            <a
              className="inline-block p-2 rounded-md text-white bg-teal-600 cursor-pointer hover:translate-y-6"
              href={`#/swap/${id}`}
            >
              <Repeat size={16} />
            </a>
          ) : null}
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
