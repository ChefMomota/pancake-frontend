import BigNumber from 'bignumber.js'
import {
  SerializedFarm,
  DeserializedPool,
  SerializedPool,
  SerializedCakeVault,
  SerializedIfoCakeVault,
  DeserializedIfoCakeVault,
  DeserializedCakeVault,
} from 'state/types'
import { deserializeToken } from 'state/user/hooks/helpers'
import { BIG_ZERO } from 'utils/bigNumber'

type UserData =
  | DeserializedPool['userData']
  | {
      allowance: number | string
      stakingTokenBalance: number | string
      stakedBalance: number | string
      pendingReward: number | string
    }

export const transformUserData = (userData: UserData) => {
  return {
    allowance: userData ? new BigNumber(userData.allowance) : BIG_ZERO,
    stakingTokenBalance: userData ? new BigNumber(userData.stakingTokenBalance) : BIG_ZERO,
    stakedBalance: userData ? new BigNumber(userData.stakedBalance) : BIG_ZERO,
    pendingReward: userData ? new BigNumber(userData.pendingReward) : BIG_ZERO,
  }
}

const transformProfileRequirement = (profileRequirement?: { required: boolean; thresholdPoints: string }) => {
  return profileRequirement
    ? {
        required: profileRequirement.required,
        thresholdPoints: profileRequirement.thresholdPoints
          ? new BigNumber(profileRequirement.thresholdPoints)
          : BIG_ZERO,
      }
    : undefined
}

export const transformPool = (pool: SerializedPool): DeserializedPool => {
  const {
    totalStaked,
    stakingLimit,
    numberBlocksForUserLimit,
    userData,
    stakingToken,
    earningToken,
    profileRequirement,
    startBlock,
    ...rest
  } = pool

  return {
    ...rest,
    startBlock,
    profileRequirement: transformProfileRequirement(profileRequirement),
    stakingToken: deserializeToken(stakingToken),
    earningToken: deserializeToken(earningToken),
    userData: transformUserData(userData),
    totalStaked: new BigNumber(totalStaked),
    stakingLimit: new BigNumber(stakingLimit),
    stakingLimitEndBlock: numberBlocksForUserLimit + startBlock,
  }
}

export const transformLockedVault = (vault: SerializedCakeVault): DeserializedCakeVault => {
  const {
    totalShares: totalSharesAsString,
    totalLockedAmount: totalLockedAmountAsString,
    pricePerFullShare: pricePerFullShareAsString,
    totalCakeInVault: totalCakeInVaultAsString,
    fees: { performanceFee, withdrawalFee, withdrawalFeePeriod },
    userData: {
      isLoading,
      userShares: userSharesAsString,
      cakeAtLastUserAction: cakeAtLastUserActionAsString,
      lastDepositedTime,
      lastUserActionTime,
      boostDebt: boostDebtAsString,
      lockEndTime,
      lockStartTime,
      locked,
      lockedAmount: lockedAmountAsString,
    },
  } = vault

  const totalShares = new BigNumber(totalSharesAsString)
  const totalLockedAmount = new BigNumber(totalLockedAmountAsString)
  const pricePerFullShare = new BigNumber(pricePerFullShareAsString)
  const totalCakeInVault = new BigNumber(totalCakeInVaultAsString)
  const userShares = new BigNumber(userSharesAsString)
  const cakeAtLastUserAction = new BigNumber(cakeAtLastUserActionAsString)
  const lockedAmount = new BigNumber(lockedAmountAsString)
  const boostDebt = new BigNumber(boostDebtAsString)

  const performanceFeeAsDecimal = performanceFee && performanceFee / 100

  return {
    totalShares,
    totalLockedAmount,
    pricePerFullShare,
    totalCakeInVault,
    fees: { performanceFee, withdrawalFee, withdrawalFeePeriod, performanceFeeAsDecimal },
    userData: {
      isLoading,
      userShares,
      cakeAtLastUserAction,
      lastDepositedTime,
      lastUserActionTime,
      lockEndTime,
      lockStartTime,
      locked,
      lockedAmount,
      boostDebt,
    },
  }
}

export const transformIfoVault = (vault: SerializedIfoCakeVault): DeserializedIfoCakeVault => {
  const {
    totalShares: totalSharesAsString,
    pricePerFullShare: pricePerFullShareAsString,
    totalCakeInVault: totalCakeInVaultAsString,
    fees: { performanceFee, withdrawalFee, withdrawalFeePeriod },
    userData: {
      isLoading,
      userShares: userSharesAsString,
      cakeAtLastUserAction: cakeAtLastUserActionAsString,
      lastDepositedTime,
      lastUserActionTime,
    },
  } = vault

  const totalShares = new BigNumber(totalSharesAsString)
  const pricePerFullShare = new BigNumber(pricePerFullShareAsString)
  const totalCakeInVault = new BigNumber(totalCakeInVaultAsString)
  const userShares = new BigNumber(userSharesAsString)
  const cakeAtLastUserAction = new BigNumber(cakeAtLastUserActionAsString)

  const performanceFeeAsDecimal = performanceFee && performanceFee / 100

  return {
    totalShares,
    pricePerFullShare,
    totalCakeInVault,
    fees: { performanceFee, withdrawalFee, withdrawalFeePeriod, performanceFeeAsDecimal },
    userData: {
      isLoading,
      userShares,
      cakeAtLastUserAction,
      lastDepositedTime,
      lastUserActionTime,
      credit: vault.userData.credit,
    },
    creditStartBlock: vault.creditStartBlock,
    creditEndBlock: vault.creditEndBlock,
  }
}

export const getTokenPricesFromFarm = (farms: SerializedFarm[]) => {
  return farms.reduce((prices, farm) => {
    const quoteTokenAddress = farm.quoteToken.address.toLocaleLowerCase()
    const tokenAddress = farm.token.address.toLocaleLowerCase()
    /* eslint-disable no-param-reassign */
    if (!prices[quoteTokenAddress]) {
      prices[quoteTokenAddress] = new BigNumber(farm.quoteTokenPriceBusd).toNumber()
    }
    if (!prices[tokenAddress]) {
      prices[tokenAddress] = new BigNumber(farm.tokenPriceBusd).toNumber()
    }
    /* eslint-enable no-param-reassign */
    return prices
  }, {})
}
