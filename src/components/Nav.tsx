import { useLazyQuery } from '@apollo/client'
import styled from '@emotion/styled'
import { ConnectModal, Flex, Modal, Navbar, Text } from '@upshot-tech/upshot-ui'
import { useWeb3React } from '@web3-react/core'
import { ConnectorName, connectorsByName } from 'constants/connectors'
import makeBlockie from 'ethereum-blockies-base64'
import {
  GET_NAV_BAR_COLLECTIONS,
  GetNavBarCollectionsData,
  GetNavBarCollectionsVars,
} from 'graphql/queries'
import { useRouter } from 'next/router'
import { useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'redux/hooks'
import { selectShowSidebar, setShowSidebar } from 'redux/reducers/layout'
import {
  selectAddress,
  selectEns,
  setActivatingConnector,
  setAddress,
  setEns,
} from 'redux/reducers/web3'
import { shortenAddress } from 'utils/address'

const SidebarShade = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 50vw;
  height: 100vh;
  background: linear-gradient(
    -90deg,
    rgba(0, 0, 0, 0.85) 50%,
    rgba(0, 0, 0, 0) 100%
  );
  animation: ${({ theme }) => theme.animations.fadeIn};
  z-index: 1;
`

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 120px;
  right: 0;
  z-index: 2;
  text-align: right;
  gap: 40px;
  animation: ${({ theme }) => theme.animations.fadeIn};
`

export const Nav = () => {
  const { activate, deactivate } = useWeb3React()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const address = useAppSelector(selectAddress)
  const showSidebar = useAppSelector(selectShowSidebar)
  const ens = useAppSelector(selectEns)
  const [navSearchTerm, setNavSearchTerm] = useState('')
  const [getNavCollections, { data: navCollectionsData }] = useLazyQuery<
    GetNavBarCollectionsData,
    GetNavBarCollectionsVars
  >(GET_NAV_BAR_COLLECTIONS)
  const [open, setOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const toggleModal = () => setOpen(!open)

  interface InputSuggestion {
    id: number
    name: string
  }

  const isAddress =
    navSearchTerm.substring(0, 2) === '0x' && navSearchTerm.length === 42

  const handleConnect = (provider: ConnectorName) => {
    dispatch(setActivatingConnector(provider))
    activate(connectorsByName[provider])
    modalRef?.current?.click()
  }

  const handleNavKeyUp = () => {
    if (navCollectionsData?.collections?.assetSets?.length) return

    getNavCollections({ variables: { limit: 1000 } })
  }

  const handleSearchSuggestionChange = (item: InputSuggestion) => {
    isAddress
      ? router.push(`/analytics/user/${encodeURIComponent(navSearchTerm)}`)
      : router.push(`/analytics/collection/${encodeURIComponent(item.id)}`)
  }

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault()

    isAddress
      ? router.push(`/analytics/user/${encodeURIComponent(navSearchTerm)}`)
      : router.push(
          `/analytics/search?query=${encodeURIComponent(navSearchTerm)}`
        )
  }

  const suggestions = useMemo(() => {
    const suggestions = navCollectionsData?.collections?.assetSets ?? []

    return isAddress
      ? [{ id: 0, name: shortenAddress(navSearchTerm) }]
      : suggestions.filter(({ name }) =>
          name.toLowerCase().includes(navSearchTerm.toLowerCase())
        )
  }, [navCollectionsData, navSearchTerm, isAddress])

  const hideMetaMask =
    typeof window['ethereum'] === 'undefined' &&
    typeof window['web3'] === 'undefined'

  const handleDisconnect = () => {
    deactivate()
    dispatch(setAddress(undefined))
    dispatch(setEns({ name: undefined, avatar: undefined }))
  }

  const handleToggleMenu = () => {
    dispatch(setShowSidebar(!showSidebar))
  }

  const sidebar = (
    <Sidebar>
      <Text sx={{ fontSize: 6 }}>Home</Text>
      <Text sx={{ fontSize: 6 }}>Analytics</Text>
    </Sidebar>
  )

  return (
    <>
      <Navbar
        avatarImageUrl={address ? makeBlockie(address) : undefined}
        ensName={ens.name}
        searchValue={navSearchTerm}
        onSearchValueChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setNavSearchTerm(e.currentTarget.value)
        }
        onSearch={handleNavSearch}
        onLogoClick={() => router.push('/')}
        onSearchSuggestionChange={handleSearchSuggestionChange}
        onSearchKeyUp={handleNavKeyUp}
        onConnectClick={toggleModal}
        onDisconnectClick={handleDisconnect}
        onMenuClick={handleToggleMenu}
        searchSuggestions={suggestions}
        {...{ address, showSidebar }}
      >
        {showSidebar && sidebar}
      </Navbar>
      <Modal ref={modalRef} onClose={toggleModal} {...{ open }}>
        <ConnectModal {...{ hideMetaMask }} onConnect={handleConnect} />
      </Modal>
      {showSidebar && <SidebarShade />}
    </>
  )
}
