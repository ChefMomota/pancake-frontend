import { useMemo } from 'react'
import { Text, Flex, Skeleton, Heading } from '@pancakeswap/uikit'
import { useWeb3React } from '@web3-react/core'
import { getCakeVaultEarnings } from 'views/Pools/helpers'
import { useTranslation } from 'contexts/Localization'
import Balance from 'components/Balance'
import { useVaultPoolByKey } from 'state/pools/hooks'
import { DeserializedPool } from 'state/types'
import { VaultPosition, getVaultPosition } from 'utils/cakePool'

import { ActionContainer, ActionTitles, ActionContent } from './styles'
import UnstakingFeeCountdownRow from '../../CakeVaultCard/UnstakingFeeCountdownRow'

interface AutoHarvestActionProps extends DeserializedPool {
  userDataLoaded: boolean
}

const AutoHarvestAction: React.FunctionComponent<AutoHarvestActionProps> = ({
  userDataLoaded,
  earningTokenPrice,
  vaultKey,
}) => {
  const { t } = useTranslation()
  const { account } = useWeb3React()

  const {
    userData: { cakeAtLastUserAction, userShares, locked, lockEndTime, currentOverdueFee, currentPerformanceFee },
    pricePerFullShare,
  } = useVaultPoolByKey(vaultKey)
  const { hasAutoEarnings, autoCakeToDisplay, autoUsdToDisplay } = getCakeVaultEarnings(
    account,
    cakeAtLastUserAction,
    userShares,
    pricePerFullShare,
    earningTokenPrice,
    currentPerformanceFee.plus(currentOverdueFee),
  )

  const position = useMemo(
    () =>
      getVaultPosition({
        userShares,
        locked,
        lockEndTime,
      }),
    [userShares, locked, lockEndTime],
  )

  const earningTokenBalance = autoCakeToDisplay
  const earningTokenDollarBalance = autoUsdToDisplay
  const hasEarnings = hasAutoEarnings

  const actionTitle = (
    <Text fontSize="12px" bold color="secondary" as="span" textTransform="uppercase">
      {t('Recent CAKE profit')}
    </Text>
  )

  if (!account) {
    return (
      <ActionContainer>
        <ActionTitles>{actionTitle}</ActionTitles>
        <ActionContent>
          <Heading>0</Heading>
        </ActionContent>
      </ActionContainer>
    )
  }

  if (!userDataLoaded) {
    return (
      <ActionContainer>
        <ActionTitles>{actionTitle}</ActionTitles>
        <ActionContent>
          <Skeleton width={180} height="32px" marginTop={14} />
        </ActionContent>
      </ActionContainer>
    )
  }

  return (
    <ActionContainer isAutoVault>
      <ActionTitles>{actionTitle}</ActionTitles>
      <ActionContent>
        <Flex flex="1" flexDirection="column" alignSelf="flex-start">
          <>
            {hasEarnings ? (
              <>
                <Balance lineHeight="1" bold fontSize="20px" decimals={5} value={earningTokenBalance} />
                {earningTokenPrice > 0 && (
                  <Balance
                    display="inline"
                    fontSize="12px"
                    color="textSubtle"
                    decimals={2}
                    prefix="~"
                    value={earningTokenDollarBalance}
                    unit=" USD"
                  />
                )}
              </>
            ) : (
              <>
                <Heading color="textDisabled">0</Heading>
                <Text fontSize="12px" color="textDisabled">
                  0 USD
                </Text>
              </>
            )}
          </>
        </Flex>
        <Flex flex="1.3" flexDirection="column" alignSelf="flex-start" alignItems="flex-start">
          {position === VaultPosition.Flexible && hasEarnings && (
            <UnstakingFeeCountdownRow vaultKey={vaultKey} isTableVariant />
          )}
          {/* IFO credit here */}
        </Flex>
      </ActionContent>
    </ActionContainer>
  )
}

export default AutoHarvestAction
