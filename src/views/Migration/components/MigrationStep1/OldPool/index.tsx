import React, { useMemo } from 'react'
import { useWeb3React } from '@web3-react/core'
import { useFetchPublicPoolsData } from 'views/Migration/hook/V1/Pool/useFetchPublicPoolsData'
import { useFetchUserPools } from 'views/Migration/hook/V1/Pool/useFetchUserPools'
import PoolsTable from './PoolTable'
import { VaultKey } from 'state/types'

const OldPool: React.FC = () => {
  const { account } = useWeb3React()
  useFetchPublicPoolsData()
  const { data: poolsWithoutAutoVault, userDataLoaded } = useFetchUserPools(account)

  const usePoolsWithVault = () => {
    const pools = useMemo(() => {
      const activePools = poolsWithoutAutoVault.filter((pool) => !pool.isFinished)
      const cakePool = activePools.find((pool) => pool.sousId === 0)
      const ifoPoolVault = { ...cakePool, vaultKey: VaultKey.IfoPool }
      const cakeAutoVault = { ...cakePool, vaultKey: VaultKey.CakeVault }

      return [ifoPoolVault, cakeAutoVault, ...poolsWithoutAutoVault]
    }, [poolsWithoutAutoVault])

    return pools
  }

  const pools = usePoolsWithVault()
  const userDataReady: boolean = !account || (!!account && userDataLoaded)

  return <PoolsTable pools={pools} account={account} userDataReady={userDataReady} />
}

export default OldPool
