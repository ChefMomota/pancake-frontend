import styled from 'styled-components'
import { Box, Flex, Text, ProfileAvatar, Skeleton } from '@pancakeswap/uikit'
import { useProfileForAddress } from 'state/profile/hooks'
import truncateHash from 'utils/truncateHash'

const Container = styled(Flex)`
  min-width: 158px;
  max-width: 158px;
  padding: 4px 4px 4px 10px;
  border-top: solid 2px ${({ theme }) => theme.colors.cardBorder};
  margin: auto;
  &:first-child {
    border: 0;
  }

  ${({ theme }) => theme.mediaQueries.sm} {
    &:first-child,
    &:nth-child(2) {
      border: 0;
    }
  }
`

interface WinnerProps {
  address: string
}

const Winner: React.FC<WinnerProps> = ({ address }) => {
  const { profile, isFetching } = useProfileForAddress(address)

  return (
    <Container>
      {!isFetching ? (
        <>
          <ProfileAvatar style={{ alignSelf: 'center' }} width={24} height={24} src={profile?.nft?.image?.thumbnail} />
          <Box ml="4px">
            <Text fontSize="12px" color="primary">
              {truncateHash(address)}
            </Text>
            <Text fontSize="12px" color="primary">
              {`@${profile?.username}`}
            </Text>
          </Box>
        </>
      ) : (
        <>
          <Skeleton width="24px" height="24px" mt="8px" />
          <Box ml="4px">
            <Skeleton width="80px" height="20px" mb="4px" />
            <Skeleton width="80px" height="20px" />
          </Box>
        </>
      )}
    </Container>
  )
}

export default Winner
