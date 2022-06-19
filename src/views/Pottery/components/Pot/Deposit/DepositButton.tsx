import { useCallback } from 'react'
import { useTranslation } from 'contexts/Localization'
import { Button, AutoRenewIcon } from '@pancakeswap/uikit'
import BigNumber from 'bignumber.js'
import { BIG_TEN } from 'utils/bigNumber'
import { useDepositPottery } from 'views/Pottery/hooks/useDepositPottery'
import { PotteryDepositStatus } from 'state/types'

interface DepositButtonProps {
  status: PotteryDepositStatus
  depositAmount: string
  setDepositAmount: (value: string) => void
}

const DepositButton: React.FC<DepositButtonProps> = ({ status, depositAmount, setDepositAmount }) => {
  const { t } = useTranslation()
  const { isPending, handleDeposit } = useDepositPottery(depositAmount)
  const depositAmountAsBN = new BigNumber(depositAmount).multipliedBy(BIG_TEN.pow(18))

  const onClickDeposit = useCallback(async () => {
    await handleDeposit()
    setDepositAmount('')
  }, [handleDeposit, setDepositAmount])

  return (
    <Button
      mt="10px"
      width="100%"
      isLoading={isPending}
      disabled={status !== PotteryDepositStatus.BEFORE_LOCK || depositAmountAsBN.lte(0) || depositAmountAsBN.isNaN()}
      endIcon={isPending ? <AutoRenewIcon spin color="currentColor" /> : null}
      onClick={onClickDeposit}
    >
      {t('Deposit CAKE')}
    </Button>
  )
}

export default DepositButton
