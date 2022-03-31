import BigNumber from 'bignumber.js'
import { SerializedLockedVaultUser } from 'state/types'
import { getCakeVaultV2Contract } from 'utils/contractHelpers'

const cakeVaultContract = getCakeVaultV2Contract()

const fetchVaultUser = async (account: string, contract = cakeVaultContract): Promise<SerializedLockedVaultUser> => {
  try {
    const userContractResponse = await contract.userInfo(account)
    return {
      isLoading: false,
      userShares: new BigNumber(userContractResponse.shares.toString()).toJSON(),
      lastDepositedTime: userContractResponse.lastDepositedTime.toString(),
      lastUserActionTime: userContractResponse.lastUserActionTime.toString(),
      cakeAtLastUserAction: new BigNumber(userContractResponse.cakeAtLastUserAction.toString()).toJSON(),
      userBoostedShare: new BigNumber(userContractResponse.userBoostedShare.toString()).toJSON(),
      locked: userContractResponse.locked,
      lockEndTime: userContractResponse.lockEndTime.toString(),
      lockStartTime: userContractResponse.lockStartTime.toString(),
      lockedAmount: new BigNumber(userContractResponse.lockedAmount.toString()).toJSON(),
    }
  } catch (error) {
    return {
      isLoading: true,
      userShares: null,
      lastDepositedTime: null,
      lastUserActionTime: null,
      cakeAtLastUserAction: null,
      userBoostedShare: null,
      lockEndTime: null,
      lockStartTime: null,
      locked: null,
      lockedAmount: null,
    }
  }
}

export default fetchVaultUser
