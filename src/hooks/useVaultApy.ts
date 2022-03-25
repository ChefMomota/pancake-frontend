import { BigNumber } from '@ethersproject/bignumber'
import { WeiPerEther } from '@ethersproject/constants'
import { BLOCKS_PER_YEAR } from 'config'
import cakeVaultV2Abi from 'config/abi/cakeVaultV2.json'
import masterChefAbi from 'config/abi/masterchef.json'
import { useMemo } from 'react'
import { useCakeVault } from 'state/pools/hooks'
import useSWRImmutable from 'swr/immutable'
import { getCakeVaultAddress, getMasterChefAddress } from 'utils/addressHelpers'
import { BIG_ZERO } from 'utils/bigNumber'
import { multicallv2 } from '../utils/multicall'
import { immutableMiddleware, useSWRMulticall } from './useSWRContract'

const BOOST_WEIGHT = BigNumber.from('1000000000000')
const DURATION_FACTOR = BigNumber.from('31536000')
const PRECISION_FACTOR = BigNumber.from('1000000000000')

const getFlexibleApy = (
  totalCakePoolEmissionPerYear: BigNumber,
  pricePerFullShare: BigNumber,
  totalShares: BigNumber,
) => totalCakePoolEmissionPerYear.div(pricePerFullShare).mul(WeiPerEther).div(totalShares)

const getBoostFactor = (
  boostWeight: BigNumber,
  duration: number,
  durationFactor: BigNumber,
  precisionFactor: BigNumber,
) => boostWeight.mul(Math.max(duration, 0)).div(durationFactor).div(precisionFactor)

const getLockedApy = (flexibleApy: number, boostFactor: BigNumber) => boostFactor.add(1).mul(flexibleApy)

const masterChefAddress = getMasterChefAddress()
const cakeVaultAddress = getCakeVaultAddress()

export function useVaultApy({ duration }: { duration: number }) {
  const { totalShares = BIG_ZERO, pricePerFullShare = BIG_ZERO } = useCakeVault()
  const totalSharesAsEtherBN = useMemo(() => BigNumber.from(totalShares.toString()), [totalShares])
  const pricePerFullShareAsEtherBN = useMemo(() => BigNumber.from(pricePerFullShare.toString()), [pricePerFullShare])

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
        params: [0],
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
      ['BOOST_WEIGHT', 'DURATION_FACTOR', 'PRECISION_FACTOR'].map((name) => ({
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
      pricePerFullShareAsEtherBN.gt(0) &&
      getFlexibleApy(totalCakePoolEmissionPerYear, pricePerFullShareAsEtherBN, totalSharesAsEtherBN).toNumber(),
    [pricePerFullShareAsEtherBN, totalCakePoolEmissionPerYear, totalSharesAsEtherBN],
  )

  const boostWeight: BigNumber = data?.[0][0] || BOOST_WEIGHT
  const durationFactor: BigNumber = data?.[1][0] || DURATION_FACTOR
  const precisionFactor: BigNumber = data?.[2][0] || PRECISION_FACTOR

  const boostFactor = useMemo(
    () => getBoostFactor(boostWeight, Math.max(duration, 0), durationFactor, precisionFactor),
    [boostWeight, duration, durationFactor, precisionFactor],
  )

  const lockedApy = useMemo(() => {
    return flexibleApy && getLockedApy(flexibleApy, boostFactor).toNumber()
  }, [boostFactor, flexibleApy])

  return {
    flexibleApy,
    lockedApy,
  }
}
