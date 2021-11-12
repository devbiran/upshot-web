import { useWeb3React } from '@web3-react/core'
import { useEagerConnect, useInactiveListener } from 'hooks/web3'
import { useEffect, useState } from 'react'
import { useAppSelector } from 'redux/hooks'
import { connectorsByName } from 'constants/connectors'
import { useAppDispatch } from 'redux/hooks'
import { ethers } from 'ethers'
import {
  selectActivatingConnector,
  setActivatingConnector,
  setAddress,
  setEns,
} from 'redux/reducers/web3'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const { connector, account, library } = useWeb3React()

  const dispatch = useAppDispatch()
  const activatingConnector = useAppSelector(selectActivatingConnector)

  useEffect(() => {
    setReady(true)
  }, [])

  /**
   * Fetch the ENS details for the connected address.
   *
   * Performs a reverse lookup by address then attempts to
   * lookup the stored 'avatar' key using the provided ENS
   * resolver if available.
   */
  const fetchEns = async (address: string) => {
    const provider = library
      ? new ethers.providers.Web3Provider(library.provider)
      : null

    if (!provider) return

    /* Reverse lookup of ENS name via address */
    let name
    try {
      name = await provider.lookupAddress(address)
    } catch (err) {
      console.error(err)
    }

    // Resolver lookup by ENS name if available.
    let resolver
    try {
      if (name) resolver = await provider.getResolver(name)
    } catch (err) {
      console.error(err)
    }

    // Avatar lookup using resolver if available.
    let avatar
    try {
      if (resolver) avatar = await resolver.getText('avatar')
    } catch (err) {
      console.error(err)
    }

    dispatch(setEns({ name, avatar }))
  }

  // Recognize the connector currently being activated.
  useEffect(() => {
    if (
      activatingConnector &&
      connectorsByName[activatingConnector] === connector
    ) {
      dispatch(setActivatingConnector(undefined))
    }
  }, [activatingConnector, connector])

  // Propogate account changes to the redux store.
  useEffect(() => {
    if (!ready) return

    dispatch(setAddress(account || undefined))
    if (!account) return

    // Fetch ENS details
    fetchEns(account)
  }, [account, library])

  // Eagerly connect to the Injected provider, if it exists and has granted access.
  const triedEager = useEagerConnect()

  // React to Injected provider events, if it exists.
  useInactiveListener(!triedEager || !!activatingConnector)

  return <>{children}</>
}