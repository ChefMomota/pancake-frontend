import { Box, Button, useModal, Flex } from '@pancakeswap/uikit'
import { useTranslation } from '@pancakeswap/localization'
import { getBalanceNumber } from '@pancakeswap/utils/formatBalance'
import BigNumber from 'bignumber.js'
import { Token } from '@pancakeswap/sdk'
import { VaultKey } from 'state/types'
import { useVaultPoolByKey } from 'state/pools/hooks'
import { useVaultApprove, useCheckVaultApprovalStatus } from 'views/Pools/hooks/useApprove'
import ExtendButton from 'views/Pools/components/LockedPool/Buttons/ExtendDurationButton'
import LockedStakedModal from 'views/Pools/components/LockedPool/Modals/LockedStakeModal'

interface ActionsProps {
  lockEndTime: string
  lockStartTime: string
  lockedAmount: BigNumber
  stakingToken: Token
  currentBalance: BigNumber
  isOnlyNeedExtendLock: boolean
}

const Actions: React.FC<React.PropsWithChildren<ActionsProps>> = ({
  lockEndTime,
  lockStartTime,
  lockedAmount,
  stakingToken,
  currentBalance,
  isOnlyNeedExtendLock,
}) => {
  const { t } = useTranslation()
  const { isVaultApproved, setLastUpdated } = useCheckVaultApprovalStatus(VaultKey.CakeVault)
  const vaultData = useVaultPoolByKey(VaultKey.CakeVault)
  const {
    userData: { userShares, balance },
  } = vaultData

  const lockedAmountAsNumber = getBalanceNumber(lockedAmount)

  const [openPresentLockedStakeModal] = useModal(
    <LockedStakedModal
      currentBalance={currentBalance}
      stakingToken={stakingToken}
      stakingTokenBalance={currentBalance}
    />,
  )

  const { handleApprove, pendingTx } = useVaultApprove(VaultKey.CakeVault, setLastUpdated)

  return (
    <Flex width="250px" flexDirection={['column', 'column', 'column', 'row']} mt="32px">
      {!isOnlyNeedExtendLock ? (
        <Box width="100%">
          {!isVaultApproved && !balance.cakeAsBigNumber.gt(0) && !userShares.gt(0) ? (
            <Button width="100%" variant="secondary" disabled={pendingTx} onClick={handleApprove}>
              {t('Enable')}
            </Button>
          ) : (
            <Button width="100%" onClick={openPresentLockedStakeModal}>
              {t('Lock CAKE')}
            </Button>
          )}
        </Box>
      ) : (
        <ExtendButton
          lockEndTime={lockEndTime}
          lockStartTime={lockStartTime}
          stakingToken={stakingToken}
          currentBalance={currentBalance}
          currentLockedAmount={lockedAmountAsNumber}
        >
          {t('Extend Lock')}
        </ExtendButton>
      )}
    </Flex>
  )
}

export default Actions
