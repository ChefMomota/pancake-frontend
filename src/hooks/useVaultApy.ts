import { BigNumber, FixedNumber } from '@ethersproject/bignumber'
import { WeiPerEther } from '@ethersproject/constants'
import { BLOCKS_PER_YEAR } from 'config'
import cakeVaultV2Abi from 'config/abi/cakeVaultV2.json'
import masterChefAbi from 'config/abi/masterchef.json'
import { useCallback, useMemo } from 'react'
import { useCakeVault } from 'state/pools/hooks'
import useSWRImmutable from 'swr/immutable'
import { getCakeVaultAddress, getMasterChefAddress } from 'utils/addressHelpers'
import { BIG_ZERO } from 'utils/bigNumber'
import { multicallv2 } from '../utils/multicall'
import { immutableMiddleware, useSWRMulticall } from './useSWRContract'

const masterChefAddress = getMasterChefAddress()
const cakeVaultAddress = getCakeVaultAddress()

// default
export const DEFAULT_MAX_DURATION = 31536000
const DEFAULT_BOOST_WEIGHT = BigNumber.from('1000000000000')
const DEFAULT_DURATION_FACTOR = BigNumber.from('31536000')

// constant, consider move it to config
const PRECISION_FACTOR = BigNumber.from('1000000000000')

const getFlexibleApy = (
  totalCakePoolEmissionPerYear: BigNumber,
  pricePerFullShare: FixedNumber,
  totalShares: FixedNumber,
) =>
  FixedNumber.from(totalCakePoolEmissionPerYear.mul(WeiPerEther))
    .divUnsafe(pricePerFullShare)
    .divUnsafe(totalShares)
    .mulUnsafe(FixedNumber.from(100))

const getBoostFactor = (boostWeight: BigNumber, duration: number, durationFactor: BigNumber) =>
  boostWeight.mul(Math.max(duration, 0)).div(durationFactor).div(PRECISION_FACTOR)

const getLockedApy = (flexibleApy: string, boostFactor: number) =>
  FixedNumber.from(flexibleApy).mulUnsafe(FixedNumber.from(1 + boostFactor))

const cakePoolPID = 5 // TODO: change in production

export function useVaultApy({ duration = DEFAULT_MAX_DURATION }: { duration?: number } = {}) {
  const { totalShares = BIG_ZERO, pricePerFullShare = BIG_ZERO } = useCakeVault()
  const totalSharesAsEtherBN = useMemo(() => FixedNumber.from(totalShares.toString()), [totalShares])
  const pricePerFullShareAsEtherBN = useMemo(() => FixedNumber.from(pricePerFullShare.toString()), [pricePerFullShare])

  const { data: totalCakePoolEmissionPerYear } = useSWRImmutable('masterChef-total-cake-pool-emission', async () => {
    const calls = [
      {
        address: masterChefAddress,
        name: 'cakePerBlock',
        params: [false],
      },
      {
        address: masterChefAddress,
        name: 'poolInfo',
        params: [cakePoolPID],
      },
      {
        address: masterChefAddress,
        name: 'totalSpecialAllocPoint',
      },
    ]

    const [[specialFarmsPerBlock], cakePoolInfo, [totalSpecialAllocPoint]] = await multicallv2(masterChefAbi, calls)
    const cakePoolSharesInSpecialFarms = cakePoolInfo.allocPoint.div(totalSpecialAllocPoint)
    return specialFarmsPerBlock.mul(BLOCKS_PER_YEAR).mul(cakePoolSharesInSpecialFarms)
  })

  const calls = useMemo(
    () =>
      ['BOOST_WEIGHT', 'DURATION_FACTOR'].map((name) => ({
        address: cakeVaultAddress,
        name,
      })),
    [],
  )
  const { data } = useSWRMulticall(cakeVaultV2Abi, calls, {
    use: [immutableMiddleware],
  })

  const flexibleApy = useMemo(
    () =>
      totalCakePoolEmissionPerYear &&
      !pricePerFullShareAsEtherBN.isZero() &&
      !totalSharesAsEtherBN.isZero() &&
      getFlexibleApy(totalCakePoolEmissionPerYear, pricePerFullShareAsEtherBN, totalSharesAsEtherBN).toString(),
    [pricePerFullShareAsEtherBN, totalCakePoolEmissionPerYear, totalSharesAsEtherBN],
  )

  const boostWeight: BigNumber = data?.[0][0] || DEFAULT_BOOST_WEIGHT
  const durationFactor: BigNumber = data?.[1][0] || DEFAULT_DURATION_FACTOR

  const boostFactor = useMemo(
    () => getBoostFactor(boostWeight, Math.max(duration, 0), durationFactor),
    [boostWeight, duration, durationFactor],
  )

  const lockedApy = useMemo(() => {
    return flexibleApy && getLockedApy(flexibleApy, boostFactor.toNumber()).toString()
  }, [boostFactor, flexibleApy])

  return {
    flexibleApy,
    lockedApy,
    getLockedApy: useCallback(
      (adjustDuration: number) =>
        flexibleApy &&
        getLockedApy(flexibleApy, getBoostFactor(boostWeight, adjustDuration, durationFactor).toNumber()).toString(),
      [boostWeight, durationFactor, flexibleApy],
    ),
  }
}
