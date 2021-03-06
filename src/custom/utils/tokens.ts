import { SupportedChainId as ChainId } from 'constants/chains'
import { GpEther as ETHER, WETH9_EXTENDED as WETH } from 'constants/tokens'

export function toErc20Address(tokenAddress: string, chainId: ChainId): string {
  let checkedAddress = tokenAddress
  if (tokenAddress === 'ETH' || tokenAddress === ETHER.onChain(chainId).symbol) {
    checkedAddress = WETH[chainId].address
  }

  return checkedAddress
}
