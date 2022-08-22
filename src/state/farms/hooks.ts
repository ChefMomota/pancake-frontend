import { ChainId } from '@pancakeswap/sdk'
import BigNumber from 'bignumber.js'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { SLOW_INTERVAL } from 'config/constants'
import { useCakeBusdPrice } from 'hooks/useBUSDPrice'
import { useFastRefreshEffect } from 'hooks/useRefreshEffect'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from 'state'
import useSWRImmutable from 'swr/immutable'
import { getFarmApr } from 'utils/apr'
import { BIG_ZERO } from 'utils/bigNumber'
import { FarmWithStakedValue } from 'views/Farms/components/types'
import { useBCakeProxyContractAddress } from 'views/Farms/hooks/useBCakeProxyContractAddress'
import { getMasterchefContract } from 'utils/contractHelpers'
import { getFarmConfig } from 'config/constants/farms/index'
import { fetchFarmsPublicDataAsync, fetchFarmUserDataAsync, fetchInitialFarmsData } from '.'
import { DeserializedFarm, DeserializedFarmsState, DeserializedFarmUserData, State } from '../types'
import {
  farmFromLpSymbolSelector,
  farmSelector,
  makeBusdPriceFromPidSelector,
  makeFarmFromPidSelector,
  makeLpTokenPriceFromLpSymbolSelector,
  makeUserFarmFromPidSelector,
} from './selectors'

export function useFarmsLength() {
  const { chainId } = useActiveWeb3React()
  return useSWRImmutable(chainId ? ['farmsLength', chainId] : null, async () => {
    const mc = getMasterchefContract(undefined, chainId)
    return (await mc.poolLength()).toNumber()
  })
}

export const usePollFarmsWithUserData = () => {
  const dispatch = useAppDispatch()
  const { account, chainId } = useActiveWeb3React()
  const { proxyAddress } = useBCakeProxyContractAddress(account)
  const farmsConfig = getFarmConfig(chainId)

  useSWRImmutable(
    chainId ? ['publicFarmData', chainId] : null,
    () => {
      const pids = farmsConfig.map((farmToFetch) => farmToFetch.pid)
      dispatch(fetchFarmsPublicDataAsync({ pids, chainId }))
    },
    {
      refreshInterval: SLOW_INTERVAL,
    },
  )

  const name = proxyAddress
    ? ['farmsWithUserData', account, proxyAddress, chainId]
    : ['farmsWithUserData', account, chainId]

  useSWRImmutable(
    account ? name : null,
    () => {
      const pids = farmsConfig.map((farmToFetch) => farmToFetch.pid)
      const params = proxyAddress ? { account, pids, proxyAddress, chainId } : { account, pids, chainId }

      dispatch(fetchFarmUserDataAsync(params))
    },
    {
      refreshInterval: SLOW_INTERVAL,
    },
  )
}

/**
 * Fetches the "core" farm data used globally
 * 2 = CAKE-BNB LP
 * 3 = BUSD-BNB LP
 */
const coreFarmPIDs = {
  56: [2, 3],
  97: [1, 2],
  5: [1, 2],
}

export const usePollCoreFarmData = () => {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()

  useEffect(() => {
    if (chainId) {
      dispatch(fetchInitialFarmsData({ chainId }))
    }
  }, [chainId, dispatch])

  useFastRefreshEffect(() => {
    if (chainId) {
      dispatch(fetchFarmsPublicDataAsync({ pids: coreFarmPIDs[chainId], chainId }))
    }
  }, [dispatch, chainId])
}

export const useFarms = (): DeserializedFarmsState => {
  const { chainId } = useActiveWeb3React()
  return useSelector(farmSelector(chainId))
}

export const useFarmsPoolLength = (): number => {
  return useSelector((state: State) => state.farms.poolLength)
}

export const useFarmFromPid = (pid: number): DeserializedFarm => {
  const farmFromPid = useMemo(() => makeFarmFromPidSelector(pid), [pid])
  return useSelector(farmFromPid)
}

export const useFarmFromLpSymbol = (lpSymbol: string): DeserializedFarm => {
  const farmFromLpSymbol = useMemo(() => farmFromLpSymbolSelector(lpSymbol), [lpSymbol])
  return useSelector(farmFromLpSymbol)
}

export const useFarmUser = (pid): DeserializedFarmUserData => {
  const farmFromPidUser = useMemo(() => makeUserFarmFromPidSelector(pid), [pid])
  return useSelector(farmFromPidUser)
}

// Return the base token price for a farm, from a given pid
export const useBusdPriceFromPid = (pid: number): BigNumber => {
  const busdPriceFromPid = useMemo(() => makeBusdPriceFromPidSelector(pid), [pid])
  return useSelector(busdPriceFromPid)
}

export const useLpTokenPrice = (symbol: string) => {
  const lpTokenPriceFromLpSymbol = useMemo(() => makeLpTokenPriceFromLpSymbolSelector(symbol), [symbol])
  return useSelector(lpTokenPriceFromLpSymbol)
}

/**
 * @deprecated use the BUSD hook in /hooks
 */
export const usePriceCakeBusd = (): BigNumber => {
  const price = useCakeBusdPrice()
  return useMemo(() => (price ? new BigNumber(price.toSignificant(6)) : BIG_ZERO), [price])
}

export const useFarmWithStakeValue = (farm: DeserializedFarm): FarmWithStakedValue => {
  const { pathname } = useRouter()
  const cakePrice = usePriceCakeBusd()
  const { regularCakePerBlock } = useFarms()

  const isArchived = pathname.includes('archived')
  const isInactive = pathname.includes('history')
  const isActive = !isInactive && !isArchived

  if (!farm.lpTotalInQuoteToken || !farm.quoteTokenPriceBusd) {
    return farm
  }
  const totalLiquidity = new BigNumber(farm.lpTotalInQuoteToken).times(farm.quoteTokenPriceBusd)
  const { cakeRewardsApr, lpRewardsApr } = isActive
    ? getFarmApr(
        new BigNumber(farm.poolWeight),
        cakePrice,
        totalLiquidity,
        farm.lpAddresses[ChainId.BSC],
        regularCakePerBlock,
      )
    : { cakeRewardsApr: 0, lpRewardsApr: 0 }

  return { ...farm, apr: cakeRewardsApr, lpRewardsApr, liquidity: totalLiquidity }
}
