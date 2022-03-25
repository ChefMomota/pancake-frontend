import { BigNumber } from '@ethersproject/bignumber'
import { WeiPerEther } from '@ethersproject/constants'
import { BLOCKS_PER_YEAR } from 'config'
import cakeVaultV2 from 'config/abi/cakeVaultV2.json'
import { useMemo } from 'react'
import { useCakeVault } from 'state/pools/hooks'
import useSWRImmutable from 'swr/immutable'
import { BIG_ZERO } from 'utils/bigNumber'
import { useCakeVaultContract, useMasterchef } from './useContract'
import { immutableMiddleware, useSWRMulticall } from './useSWRContract'

const BOOST_WEIGHT = BigNumber.from('1000000000000')
const DURATION_FACTOR = BigNumber.from('31536000')
const PRECISION_FACTOR = BigNumber.from('1000000000000')

export function useVaultApy({ duration }: { duration: number }) {
  const masterChef = useMasterchef(false)
  const cakeVaultContract = useCakeVaultContract(false)
  const { totalShares = BIG_ZERO, pricePerFullShare = BIG_ZERO } = useCakeVault()
  const totalSharesAsEtherBN = useMemo(() => BigNumber.from(totalShares.toString()), [totalShares])
  const pricePerFullShareAsEtherBN = useMemo(() => BigNumber.from(pricePerFullShare.toString()), [pricePerFullShare])

  const { data: totalCakePoolEmissionPerYear } = useSWRImmutable('masterChef-total-cake-pool-emission', async () => {
    const specialFarmsPerBlock = await masterChef.cakePerBlock(false)
    const cakePoolInfo = await masterChef.poolInfo(0)
    const totalSpecialAllocPoint = await masterChef.totalSpecialAllocPoint()
    const cakePoolSharesInSpecialFarms = cakePoolInfo.allocPoint.div(totalSpecialAllocPoint)
    return specialFarmsPerBlock.mul(BLOCKS_PER_YEAR).mul(cakePoolSharesInSpecialFarms)
  })

  const calls = useMemo(
    () =>
      ['BOOST_WEIGHT', 'DURATION_FACTOR', 'PRECISION_FACTOR'].map((name) => ({
        address: cakeVaultContract.address,
        name,
      })),
    [cakeVaultContract.address],
  )
  const { data } = useSWRMulticall(cakeVaultV2, calls, {
    use: [immutableMiddleware],
  })

  const flexibleApy = useMemo(
    () =>
      totalCakePoolEmissionPerYear &&
      totalCakePoolEmissionPerYear
        .div(pricePerFullShareAsEtherBN)
        .mul(WeiPerEther)
        .div(totalSharesAsEtherBN)
        .toNumber(),
    [pricePerFullShareAsEtherBN, totalCakePoolEmissionPerYear, totalSharesAsEtherBN],
  )

  const boostWeight: BigNumber = data?.[0][0] || BOOST_WEIGHT
  const durationFactor: BigNumber = data?.[1][0] || DURATION_FACTOR
  const precisionFactor: BigNumber = data?.[2][0] || PRECISION_FACTOR

  const boostFactor = useMemo(
    () => boostWeight.mul(Math.max(duration, 0)).div(durationFactor).div(precisionFactor),
    [boostWeight, duration, durationFactor, precisionFactor],
  )

  const lockedApy = useMemo(() => {
    return (
      totalCakePoolEmissionPerYear &&
      totalCakePoolEmissionPerYear
        .div(pricePerFullShareAsEtherBN)
        .mul(boostFactor.add(1).mul(WeiPerEther))
        .div(totalSharesAsEtherBN)
        .toNumber()
    )
  }, [boostFactor, pricePerFullShareAsEtherBN, totalCakePoolEmissionPerYear, totalSharesAsEtherBN])

  return {
    flexibleApy,
    lockedApy,
  }
}
