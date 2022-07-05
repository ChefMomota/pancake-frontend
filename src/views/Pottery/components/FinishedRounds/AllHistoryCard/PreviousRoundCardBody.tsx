import { useMemo } from 'react'
import styled from 'styled-components'
import { Box, Flex, Text, CardBody, CardRibbon, LinkExternal, Skeleton } from '@pancakeswap/uikit'
import BigNumber from 'bignumber.js'
import { getBalanceNumber } from 'utils/formatBalance'
import Balance from 'components/Balance'
import { useTranslation } from 'contexts/Localization'
import { usePriceCakeBusd } from 'state/farms/hooks'
import { PotteryRoundInfo } from 'state/types'
import Divider from 'components/Divider'
import { getBscScanLink } from 'utils'
import Winner from './Winner'

const StyledCardBody = styled(CardBody)`
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const StyledCardRibbon = styled(CardRibbon)`
  right: -20px;
  top: -20px;

  ${({ theme }) => theme.mediaQueries.xs} {
    right: -10px;
    top: -10px;
  }
`

const WinnersContainer = styled(Flex)`
  width: 100%;
  flex-direction: column;
  flex-wrap: wrap;
  margin: 20px 0 0 0;

  ${({ theme }) => theme.mediaQueries.sm} {
    width: 316px;
    flex-direction: row;
    margin: 0 0 0 32px;
  }
`

interface PreviousRoundCardBodyProps {
  latestRoundId: string
  finishedRoundInfo: PotteryRoundInfo
}

const PreviousRoundCardBody: React.FC<PreviousRoundCardBodyProps> = ({ latestRoundId, finishedRoundInfo }) => {
  const { t } = useTranslation()
  const { isFetched, roundId, prizePot, totalPlayers, txid, winners } = finishedRoundInfo
  const cakePriceBusd = usePriceCakeBusd()

  const prizeAsBn = new BigNumber(prizePot)
  const prize = getBalanceNumber(prizeAsBn)
  const prizeInBusd = new BigNumber(prize).times(cakePriceBusd).toNumber()

  const isLatest = useMemo(() => new BigNumber(latestRoundId).minus(1).eq(roundId), [latestRoundId, roundId])

  if (!isFetched) {
    return <Skeleton margin="24px" maxWidth="100%" height="96px" />
  }

  return (
    <StyledCardBody>
      {isLatest && <StyledCardRibbon text={t('Latest')} />}
      <Flex flexDirection={['column']} width="100%">
        <Flex flexDirection={['column', 'column', 'row']}>
          <Text style={{ alignSelf: 'center' }} fontSize="20px" bold>
            {t('Winner')}
          </Text>
          <WinnersContainer>
            {winners && winners.map((address) => <Winner key={address} address={address} />)}
          </WinnersContainer>
        </Flex>
        <Box width="100%">
          <Divider />
        </Box>
      </Flex>
      <Flex flexDirection="column" width="100%" mt="8px">
        <Text fontSize="20px" textAlign={['center', 'center', 'left']} lineHeight="110%" bold>
          {t('Prize Pot')}
        </Text>
        <Balance
          prefix="~$"
          bold
          color="secondary"
          lineHeight="110%"
          fontSize={['32px', '32px', '40px']}
          textAlign={['center', 'center', 'left']}
          decimals={0}
          value={prize}
        />
        <Balance
          unit=" CAKE"
          mb="18px"
          fontSize="14px"
          color="textSubtle"
          textAlign={['center', 'center', 'left']}
          decimals={0}
          value={prizeInBusd}
        />
        <Flex flexDirection={['column', 'column', 'row']} justifyContent="space-between">
          <Flex alignSelf={['center', 'center', 'flex-end']}>
            <Text fontSize="14px">{t('Total players this round:')}</Text>
            <Balance bold ml="4px" fontSize="14px" decimals={0} value={Number(totalPlayers)} />
          </Flex>
          <LinkExternal m={['auto', 'auto', '0px']} href={getBscScanLink(txid, 'transaction')}>
            {t('View on BscScan')}
          </LinkExternal>
        </Flex>
      </Flex>
    </StyledCardBody>
  )
}

export default PreviousRoundCardBody
