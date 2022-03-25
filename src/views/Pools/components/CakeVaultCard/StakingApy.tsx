import { Flex, Text } from '@pancakeswap/uikit'
import { BigNumber } from '@ethersproject/bignumber'
import { LightGreyCard } from 'components/Card'
import { useTranslation } from 'contexts/Localization'
import { useVaultApy } from 'hooks/useVaultApy'
import { useVaultMaxDuration } from 'hooks/useVaultMaxDuration'
import Balance from 'components/Balance'
import { memo } from 'react'

const DEFAULT_MAX_DURATION = BigNumber.from('31536000')

export const StakingApy = memo(() => {
  const { t } = useTranslation()

  const maxLockDuration = useVaultMaxDuration()
  const { flexibleApy, lockedApy } = useVaultApy({ duration: (maxLockDuration || DEFAULT_MAX_DURATION).toNumber() })

  return (
    <LightGreyCard>
      <Flex alignItems="center" justifyContent="space-between">
        <Text color="textSubtle" textTransform="uppercase" bold fontSize="12px">
          {t('Flexible staking')} APY:
        </Text>
        <Balance fontSize="16px" value={flexibleApy} decimals={2} unit="%" />
      </Flex>
      <Flex alignItems="center" justifyContent="space-between">
        <Text color="textSubtle" textTransform="uppercase" bold fontSize="12px">
          {t('Locked staking')} APY:
        </Text>
        <Balance fontSize="16px" value={lockedApy} decimals={2} unit="%" />
      </Flex>
    </LightGreyCard>
  )
})
