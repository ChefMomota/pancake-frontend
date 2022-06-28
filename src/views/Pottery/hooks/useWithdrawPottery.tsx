import { useCallback } from 'react'
import { useAppDispatch } from 'state'
import { useTranslation } from 'contexts/Localization'
import useToast from 'hooks/useToast'
import useCatchTxError from 'hooks/useCatchTxError'
import { ToastDescriptionWithTx } from 'components/Toast'
import { usePotterytValutContract } from 'hooks/useContract'
import { useWeb3React } from '@web3-react/core'
import { fetchPotteryUserDataAsync } from 'state/pottery'

export const useWithdrawPottery = (redeemShare: string) => {
  const { t } = useTranslation()
  const { account } = useWeb3React()
  const dispatch = useAppDispatch()
  const { toastSuccess } = useToast()
  const { fetchWithCatchTxError, loading: isPending } = useCatchTxError()
  const contract = usePotterytValutContract()

  const handleWithdraw = useCallback(async () => {
    const receipt = await fetchWithCatchTxError(() => contract.redeem(redeemShare, account, account))

    if (receipt?.status) {
      toastSuccess(
        t('Success!'),
        <ToastDescriptionWithTx txHash={receipt.transactionHash}>
          {t('Your earnings have also been harvested to your wallet')}
        </ToastDescriptionWithTx>,
      )
      dispatch(fetchPotteryUserDataAsync(account))
    }
  }, [account, contract, redeemShare, t, dispatch, fetchWithCatchTxError, toastSuccess])

  return { isPending, handleWithdraw }
}
