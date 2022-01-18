import { Price, CurrencyAmount, Currency, Fraction } from '@uniswap/sdk-core'
import JSBI from 'jsbi'

export function isEmpty(amount: CurrencyAmount<Currency> | undefined): boolean {
  if (!amount) {
    return true
  }

  if (JSBI.equal(amount.quotient, JSBI.BigInt(0))) {
    return true
  }

  return false
}

export function formatCurrencyAmount(
  amount: CurrencyAmount<Currency> | undefined,
  sigFigs: number,
  fixed: number | undefined = undefined
) {
  if (!amount) {
    return '-'
  }

  if (JSBI.equal(amount.quotient, JSBI.BigInt(0))) {
    return '0'
  }

  if (amount.divide(amount.decimalScale).lessThan(new Fraction(1, 100000))) {
    return '<0.00001'
  }

  return fixed === undefined ? amount.toSignificant(sigFigs) : amount?.toFixed(fixed, undefined, 1)
}

export function formatPrice(price: Price<Currency, Currency> | undefined, sigFigs: number) {
  if (!price) {
    return '-'
  }

  if (parseFloat(price.toFixed(sigFigs)) < 0.0001) {
    return '<0.0001'
  }

  return price.toSignificant(sigFigs)
}
