import { useEffect, useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { timeFormat } from 'views/TradingReward/utils/timeFormat'
import { Card, Table, Th, Td, Text, Flex, PaginationButton, useMatchBreakpoints } from '@pancakeswap/uikit'
import { useTranslation } from '@pancakeswap/localization'
import { UserCampaignInfoDetail } from 'views/TradingReward/hooks/useAllUserCampaignInfo'
import { AllTradingRewardPairDetail } from 'views/TradingReward/hooks/useAllTradingRewardPair'
import { formatNumber } from '@pancakeswap/utils/formatBalance'
import useRewardBreakdown, { RewardBreakdownDetail } from 'views/TradingReward/hooks/useRewardBreakdown'

interface RewardsBreakdownProps {
  campaignId: string
  allUserCampaignInfo: UserCampaignInfoDetail[]
  allTradingRewardPairData: AllTradingRewardPairDetail
}

const MAX_PER_PAGE = 1

const initList: RewardBreakdownDetail = {
  campaignId: '',
  campaignStart: 0,
  campaignClaimTime: 0,
  pairs: [],
}

const RewardsBreakdown: React.FC<React.PropsWithChildren<RewardsBreakdownProps>> = ({
  campaignId,
  allUserCampaignInfo,
  allTradingRewardPairData,
}) => {
  const {
    t,
    currentLanguage: { locale },
  } = useTranslation()
  const { address: account } = useAccount()
  const { isDesktop } = useMatchBreakpoints()
  const [currentPage, setCurrentPage] = useState(1)
  const [maxPage, setMaxPages] = useState(1)
  const [list, setList] = useState<RewardBreakdownDetail>(initList)

  const { data, isFetching } = useRewardBreakdown({
    allUserCampaignInfo,
    allTradingRewardPairData,
  })

  const sortData = useMemo(() => {
    return data.sort((a, b) => {
      if (a?.campaignId?.toLowerCase() === campaignId?.toLowerCase()) {
        return -1
      }
      if (b?.campaignId?.toLowerCase() === campaignId?.toLowerCase()) {
        return 1
      }
      return 0
    })
  }, [data, campaignId])

  useEffect(() => {
    if (sortData.length > 0) {
      const max = Math.ceil(sortData.length / MAX_PER_PAGE)
      setMaxPages(max)
    }

    return () => {
      setMaxPages(1)
      setCurrentPage(1)
      setList(initList)
    }
  }, [sortData])

  useEffect(() => {
    const getActivitySlice = () => {
      const slice = sortData.slice(MAX_PER_PAGE * (currentPage - 1), MAX_PER_PAGE * currentPage)
      setList({ ...slice[0] })
    }
    if (sortData.length > 0) {
      getActivitySlice()
    }
  }, [currentPage, sortData])

  if (!account) {
    return null
  }

  return (
    <Flex
      id="rewards-breakdown"
      flexDirection="column"
      padding="0 16px"
      margin={['0 auto 72px auto', '0 auto 72px auto', '0 auto 72px auto', '0 auto 56px auto']}
      width={['100%', '100%', '100%', '100%', '100%', '100%', '1140px']}
    >
      <Text lineHeight="110%" textAlign="center" color="secondary" mb="16px" bold fontSize={['40px']}>
        {t('Rewards Breakdown')}
      </Text>
      <Text textAlign="center" color="textSubtle" bold>
        {`${timeFormat(locale, list.campaignStart)} - ${timeFormat(locale, list.campaignStart)}`}
      </Text>
      <Text textAlign="center" color="textSubtle" mb="40px">
        {`${t('Campaign')} ${list.campaignId} ${
          list.campaignId?.toLowerCase() === campaignId?.toLowerCase() ? t('(current period)') : ''
        }`}
      </Text>
      <Card>
        <Table>
          <thead>
            <tr>
              <Th textAlign={['left']}> {t('Trading Pair')}</Th>
              {isDesktop ? (
                <>
                  <Th textAlign={['left']}> {t('Your Volume')}</Th>
                  <Th textAlign={['left']}> {t('Reward Earned')}</Th>
                  <Th textAlign={['center']}> {t('Total Volume')}</Th>
                  <Th textAlign={['right']}> {t('Total reward')}</Th>
                </>
              ) : (
                <>
                  <Th textAlign={['right']}> {t('Your Vol. /Reward Earned')}</Th>
                  <Th textAlign={['right']}> {t('Total Vol./Total reward')}</Th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            <>
              {isFetching ? (
                <tr>
                  <Td colSpan={isDesktop ? 5 : 3} textAlign="center">
                    {t('Loading...')}
                  </Td>
                </tr>
              ) : (
                <>
                  {list.pairs.length === 0 ? (
                    <tr>
                      <Td colSpan={isDesktop ? 5 : 3} textAlign="center">
                        {t('No results')}
                      </Td>
                    </tr>
                  ) : (
                    <>
                      {list.pairs.map((pair) => (
                        <tr key={pair.address}>
                          <Td>{pair.lpSymbol}</Td>
                          {isDesktop ? (
                            <>
                              <Td>{`$${formatNumber(pair.yourVolume)}`}</Td>
                              <Td>{`$${formatNumber(pair.rewardEarned)}`}</Td>
                              <Td textAlign="center">{`$${formatNumber(pair.totalVolume)}`}</Td>
                              <Td textAlign="right">{`$${formatNumber(pair.totalReward)}`}</Td>
                            </>
                          ) : (
                            <>
                              <Td>
                                <Text textAlign="right">{`$${formatNumber(pair.yourVolume)}`}</Text>
                                <Text textAlign="right" color="textSubtle">
                                  {`$${formatNumber(pair.rewardEarned)}`}
                                </Text>
                              </Td>
                              <Td>
                                <Text textAlign="right">{`$${formatNumber(pair.totalVolume)}`}</Text>
                                <Text textAlign="right" color="textSubtle">
                                  {`$${formatNumber(pair.totalReward)}`}
                                </Text>
                              </Td>
                            </>
                          )}
                        </tr>
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          </tbody>
        </Table>
        <PaginationButton showMaxPageText currentPage={currentPage} maxPage={maxPage} setCurrentPage={setCurrentPage} />
      </Card>
    </Flex>
  )
}

export default RewardsBreakdown
