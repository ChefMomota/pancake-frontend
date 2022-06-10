import { Ifo, PoolIds } from 'config/constants/types'
import { getIfoV3Contract } from 'utils/contractHelpers'
import BigNumber from 'bignumber.js'
import { BIG_ZERO } from 'utils/bigNumber'
import { multicallv2 } from 'utils/multicall'
import ifoV3Abi from 'config/abi/ifoV3.json'

export interface VestingCharacteristics {
  vestingId: string
  offeringAmountInToken: BigNumber
  vestingReleased: BigNumber
  vestingAmountTotal: BigNumber
  vestingcomputeReleasableAmount: BigNumber
  vestingInfomationPercentage: number
}

export interface VestingData {
  ifo: Ifo
  userVestingData: {
    [PoolIds.poolUnlimited]: VestingCharacteristics
  }
}

export const fetchUserWalletIfoData = async (ifo: Ifo, account: string): Promise<VestingData> => {
  const { address } = ifo
  const readContract = getIfoV3Contract(address)
  let userVestingData = {
    poolBasic: {
      vestingId: '0',
      offeringAmountInToken: BIG_ZERO,
      vestingReleased: BIG_ZERO,
      vestingAmountTotal: BIG_ZERO,
      vestingcomputeReleasableAmount: BIG_ZERO,
      vestingInfomationPercentage: 0,
    },
    poolUnlimited: {
      vestingId: '0',
      offeringAmountInToken: BIG_ZERO,
      vestingReleased: BIG_ZERO,
      vestingAmountTotal: BIG_ZERO,
      vestingcomputeReleasableAmount: BIG_ZERO,
      vestingInfomationPercentage: 0,
    },
  }

  if (account) {
    const [basicId, unlimitedId] = await Promise.all([
      readContract.computeVestingScheduleIdForAddressAndPid(account, 0),
      readContract.computeVestingScheduleIdForAddressAndPid(account, 1),
    ])

    const ifov3Calls = [
      {
        address,
        name: 'viewUserOfferingAndRefundingAmountsForPools',
        params: [account, [0, 1]],
      },
      {
        address,
        name: 'getVestingSchedule',
        params: [basicId],
      },
      {
        address,
        name: 'getVestingSchedule',
        params: [unlimitedId],
      },
      {
        address,
        name: 'computeReleasableAmount',
        params: [basicId],
      },
      {
        address,
        name: 'computeReleasableAmount',
        params: [unlimitedId],
      },
      {
        address,
        name: 'viewPoolVestingInformation',
        params: [0],
      },
      {
        address,
        name: 'viewPoolVestingInformation',
        params: [1],
      },
    ]

    const [
      amounts,
      basicSchedule,
      unlimitedSchedule,
      basicReleasableAmount,
      unlimitedReleasableAmount,
      basicVestingInformation,
      unlimitedVestingInformation,
    ] = await multicallv2(ifoV3Abi, ifov3Calls, { requireSuccess: false })

    userVestingData = {
      [PoolIds.poolBasic]: {
        ...userVestingData[PoolIds.poolBasic],
        vestingId: basicId ? basicId.toString() : '0',
        offeringAmountInToken: new BigNumber(amounts[0][0][0].toString()),
        vestingReleased: basicSchedule ? new BigNumber(basicSchedule[0].released.toString()) : BIG_ZERO,
        vestingAmountTotal: basicSchedule ? new BigNumber(basicSchedule[0].amountTotal.toString()) : BIG_ZERO,
        vestingcomputeReleasableAmount: basicReleasableAmount
          ? new BigNumber(basicReleasableAmount.toString())
          : BIG_ZERO,
        vestingInfomationPercentage: basicVestingInformation ? basicVestingInformation[0].toNumber() : 0,
      },
      [PoolIds.poolUnlimited]: {
        ...userVestingData[PoolIds.poolUnlimited],
        vestingId: unlimitedId ? unlimitedId.toString() : '0',
        vestingReleased: unlimitedSchedule ? new BigNumber(unlimitedSchedule[0].released.toString()) : BIG_ZERO,
        vestingAmountTotal: unlimitedSchedule ? new BigNumber(unlimitedSchedule[0].amountTotal.toString()) : BIG_ZERO,
        vestingcomputeReleasableAmount: unlimitedReleasableAmount
          ? new BigNumber(unlimitedReleasableAmount.toString())
          : BIG_ZERO,
        vestingInfomationPercentage: unlimitedVestingInformation ? unlimitedVestingInformation[0].toNumber() : 0,
      },
    }
  }

  return {
    ifo,
    userVestingData,
  }
}
