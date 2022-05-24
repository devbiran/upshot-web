import { useQuery } from '@apollo/client'
import { Avatar, Button, Icon, IconButton, imageOptimizer, NFTCard, theme, Tooltip, useBreakpointIndex } from '@upshot-tech/upshot-ui'
import { Container } from '@upshot-tech/upshot-ui'
import {
  Accordion,
  Box,
  ButtonDropdown,
  Flex,
  formatNumber,
  Grid,
  Link,
  MiniNftCard,
  Text,
} from '@upshot-tech/upshot-ui'
import { BlurrySquareTemplate, Pagination } from '@upshot-tech/upshot-ui'
import { Footer } from 'components/Footer'
import { Nav } from 'components/Nav'
import { PIXELATED_CONTRACTS } from 'constants/'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from 'redux/hooks'
import { selectShowHelpModal, setShowHelpModal } from 'redux/reducers/layout'
import { shortenAddress } from 'utils/address'
import { getAssetName } from 'utils/asset'

import TopCollections from '../../Analytics/components/ExplorePanel/TopCollections'
import Breadcrumbs from '../components/Breadcrumbs'
import SearchFilterSidebar from '../components/SearchFilterSidebar'
import NFTSearchResults, {
  NFTSearchResultsSkeleton,
} from './NFTSearchResultsListView'
import {
  GET_ASSETS_SEARCH,
  GET_COLLECTION,
  GetAssetsSearchData,
  GetAssetsSearchVars,
  GetCollectionData,
  GetCollectionVars,
} from './queries'
import TraitStats from './TraitStats'

const ROW_SIZE = 4

export enum ENFTSearchResultsOrder {
  LAST_SALE_PRICE,
  LAST_APPRAISAL_PRICE,
  LIST_PRICE,
  LIST_APPRAISAL_RATIO,
}

export type OrderedNFTSearchResultsColumns = {
  [key in keyof typeof ENFTSearchResultsOrder]: string
}

export const nftSearchResultsColumns: OrderedNFTSearchResultsColumns = {
  LAST_SALE_PRICE: 'Last Sale Price',
  LAST_APPRAISAL_PRICE: 'Last Appraisal',
  LIST_PRICE: 'List Price',
  LIST_APPRAISAL_RATIO: '% Difference',
}

enum BREAKPOINT_INDEXES {
  ZERO = 0,
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
}

export default function SearchView() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const dispatch = useAppDispatch()
  const helpOpen = useSelector(selectShowHelpModal)
  const toggleHelpModal = () => dispatch(setShowHelpModal(!helpOpen))

  const breakpointIndex = useBreakpointIndex()
  const isMobile = breakpointIndex <= 1

  const collectionId = router.query.collectionId
    ? Number(router.query.collectionId)
    : undefined

  const tokenId = router.query.tokenId as string
  const minPrice = router.query.minPrice as string
  const maxPrice = router.query.maxPrice as string
  const traitANDMatch = router.query.traitANDMatch as string
  const listedOnly = router.query.listedOnly as string ?? 'true'
  const traitIds = [router.query?.traits ?? []].flat().map((val) => Number(val))
  const collectionSearch = router.query.collectionSearch as string
  const [selectedColumn, setSelectedColumn] = useState<number>(0)
  const [sortAscending, setSortAscending] = useState(false)
  const [listView, setListView] = useState(false)
  const [openMobileFilters, setOpenMobileFilters] = useState(false)

  // Trait stats
  const [selectedTraitsColumn, setSelectedTraitsColumn] = useState<number>(3)
  const [sortTraitsAscending, setSortTraitsAscending] = useState(false)
  const handleChangeTraitsSelection = (columnIdx: number) => {
    if (columnIdx === selectedTraitsColumn) {
      setSortTraitsAscending(!sortTraitsAscending)
    }

    setSelectedTraitsColumn(columnIdx)
  }

  // NFT Search Results
  const [selectedNFTColumn, setSelectedNFTColumn] = useState<number>(3)
  const [sortNFTsAscending, setSortNFTsAscending] = useState(false)
  const handleChangeNFTColumnSelection = (columnIdx: number) => {
    const ascendingColumns = [0, 1, 2]

    if (columnIdx === selectedNFTColumn) {
      setSortNFTsAscending(!sortNFTsAscending)
    } else {
      setSortAscending(ascendingColumns.includes(columnIdx))
    }

    setSelectedNFTColumn(columnIdx)
  }

  const sortOptions = [
    'Sale price: low to high',
    'Sale price: high to low',
    'Appraisal: low to high',
    'Appraisal: high to low',
    'List price: low to high',
    'List price: high to low',
    'Difference: low to high',
    'Difference: high to low',
  ]

  const handleChangeNFTColumnSortRadio = (value: string) => {
    const index = sortOptions.indexOf(value)
    /* it maps 0, 1 -> 0
    2, 3 -> 1
    4, 5 -> 2 */
    const columnIndex = Math.floor(index / 2)
    setSelectedNFTColumn(columnIndex)

    setSortNFTsAscending(index % 2 === 0) // index is even make it ascending
  }

  const getDropdownValue = () => {
    const strIndex = selectedNFTColumn * 2
    const strIndexSorted = strIndex + (sortNFTsAscending ? 0 : 1)
    return sortOptions[strIndexSorted]
  }

  // Used to wait for the router to mount before showing collectors.
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  const chunks = {
    [BREAKPOINT_INDEXES.ZERO]: 2,
    [BREAKPOINT_INDEXES.ONE]: 2,
    [BREAKPOINT_INDEXES.TWO]: 2,
    [BREAKPOINT_INDEXES.THREE]: 3,
    [BREAKPOINT_INDEXES.FOUR]: 4,
    [BREAKPOINT_INDEXES.FIVE]: 5,
    [BREAKPOINT_INDEXES.SIX]: 6,
  }

  const chunkSize = chunks[breakpointIndex]
  const loadArr = [...new Array(ROW_SIZE * chunkSize)]
  const searchQueryParam = (router.query.query as string) ?? ''

  const { loading, error, data } = useQuery<
    GetAssetsSearchData,
    GetAssetsSearchVars
  >(GET_ASSETS_SEARCH, {
    errorPolicy: 'all',
    variables: {
      limit: ROW_SIZE * chunkSize,
      offset: page * ROW_SIZE * chunkSize,
      collectionId,
      tokenId,
      minPrice,
      maxPrice,
      traitFilterJoin: traitANDMatch === 'true' ? 'AND' : 'OR',
      traitIds: traitIds.length ? traitIds : undefined,
      listed: listedOnly === 'true' ? true : undefined,
      orderColumn: Object.keys(nftSearchResultsColumns)[selectedNFTColumn],
      orderDirection: sortNFTsAscending ? 'ASC' : 'DESC',
    },
    skip: !collectionId,
  })

  const { loading: collectionLoading, data: collectionData } = useQuery<GetCollectionData, GetCollectionVars>(
    GET_COLLECTION,
    {
      errorPolicy: 'all',
      variables: { id: collectionId },
      skip: !collectionId,
    }
  )

  const handlePageChange = ({ selected }: { selected: number }) => {
    setPage(selected)
  }

  const handleChangeSelection = (columnIdx: number) => {
    if (columnIdx === selectedColumn) {
      setSortAscending(!sortAscending)
    }

    setSelectedColumn(columnIdx)
  }

  const toggleListView = (switchToListView: boolean) => {
    setListView(switchToListView)
  }

  const handleApplySearch = ({ query }) => {
    setPage(0)
    router.push({
      pathname: '/analytics/search',
      query,
    })
  }

  const assetArr = data?.assetGlobalSearch?.assets

  const storage = globalThis?.sessionStorage
  const prevPath = storage.getItem('prevPath')

  const breadcrumbs = prevPath?.includes('/nft/')
    ? [
        {
          text: 'Analytics Home',
          link: '/analytics',
        },
        {
          text: decodeURI(prevPath as string).split('nftName=')[1],
          link: prevPath,
        },
      ]
    : [
        {
          text: 'Analytics Home',
          link: '/analytics',
        },
      ]

  return (
    <>
      <Nav />
      <Container
        maxBreakpoint="xxl"
        sx={{
          flexDirection: 'column',
          minHeight: '100vh',
          gap: 4,
          padding: 4,
        }}
      >
        <Breadcrumbs crumbs={breadcrumbs} />

        <Grid
          sx={{
            gridTemplateColumns: ['1fr', '1fr', '1fr', '300px 1fr'],
            gap: [5, 5, 5, 8],
          }}
        >
          {isMobile ? (
            <>
              <Box>
                <Accordion
                  isDropdown
                  title="Search Filters"
                  open={openMobileFilters}
                  onClick={() => setOpenMobileFilters(!openMobileFilters)}
                  onClose={() => setOpenMobileFilters(false)}
                >
                  <Box sx={{ paddingTop: 4 }}>
                    <SearchFilterSidebar
                      onHideFilters={() => setOpenMobileFilters(false)}
                      onApply={handleApplySearch}
                    />
                  </Box>
                </Accordion>
              </Box>
            </>
          ) : (
            <SearchFilterSidebar onApply={handleApplySearch} />
          )}

          <Flex
            sx={{
              flex: '1 auto auto',
              flexDirection: 'column',
              width: '100%',
              gap: 6,
            }}
          >
            <Flex sx={{ flexDirection: 'column' }}>
              {(collectionData?.collectionById?.name) &&
                collectionData?.collectionById?.imageUrl &&
                collectionId && (
                  <Flex sx={{ flexDirection: 'column', gap: '16px' }}>
                    <Grid columns={['1fr', '1fr', '1fr 1fr']} sx={{ gap: '40px' }}>
                      <Flex sx={{ flexDirection: 'column', gap: '16px' }}>
                        <Flex sx={{ gap: 6, height: 100, alignItems: 'center' }}>
                          <Box
                            sx={{
                              backgroundColor: '#231F20',
                              minWidth: '63px',
                              padding: isMobile ? '4px' : '8px',
                              borderRadius: '50%',

                              flexShrink: 0,
                            }}
                          >
                            <Avatar
                              size="xl"
                              sx={{
                                width: isMobile ? '55px' : '100px',
                                height: isMobile ? '55px' : '100px',
                                minWidth: 'unset',
                              }}
                              src={
                                imageOptimizer(collectionData?.collectionById?.imageUrl, {
                                  width: parseInt(theme.images.avatar.xl.size),
                                  height: parseInt(theme.images.avatar.xl.size),
                                }) ?? collectionData?.collectionById?.imageUrl
                              }
                            />
                          </Box>
                          <Flex sx={{ flexDirection: 'column' }}>
                            <Flex sx={{ alignItems: 'center', gap: 2 }}>
                              <Text variant="h1Secondary" sx={{ lineHeight: '2rem' }}>
                                {collectionData?.collectionById?.name}
                              </Text>
                              {collectionData?.collectionById?.isAppraised && (
                                <Tooltip
                                  tooltip={'How do we price NFTs?'}
                                  sx={{ marginLeft: '0', marginTop: '5px', height: 25 }}
                                >
                                  <Icon
                                    icon="upshot"
                                    onClick={toggleHelpModal}
                                    size={25}
                                    color="primary"
                                  />
                                </Tooltip>
                              )}
                            </Flex>

                            <Text
                              color="grey"
                              variant="h4Primary"
                              sx={{
                                fontWeight: 700,
                                marginTop: '2px',
                              }}
                            >
                              Collection
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>
                      <Flex
                        sx={{
                          flexDirection: 'column',
                          gap: '16px',
                        }}
                      >
                        <Flex
                          sx={{
                            justifyContent: 'flex-end',
                            minHeight: isMobile ? 0 : 100,
                            marginBottom: isMobile ? 5 : 0,
                            width: isMobile ? '100%' : 'auto',
                          }}
                        >
                          <Link
                            href={`/analytics/collection/${collectionId}`}
                            sx={{
                              width: isMobile ? '100%' : 'auto',
                            }}
                            component={NextLink}
                            noHover
                          >
                            <Button
                              icon={<Icon icon="analytics" />}
                              sx={{
                                width: isMobile ? '100%' : 'auto',
                                '& span': {
                                  textTransform: 'none',
                                },
                                '&:not(:hover) svg': {
                                  path: { fill: '#000 !important' },
                                },
                              }}
                            >
                              Collection Analytics
                            </Button>
                          </Link>
                        </Flex>
                      </Flex>
                    </Grid>
                  </Flex>
                )}

              {!!collectionId && traitIds.length > 0 && (
                <TraitStats
                  selectedColumn={selectedTraitsColumn}
                  sortAscending={sortTraitsAscending}
                  onChangeSelection={handleChangeTraitsSelection}
                  {...{ collectionId, traitIds }}
                />
              )}
            </Flex>

            {error ? (
              <div>There was an error completing your request</div>
            ) : data?.assetGlobalSearch?.assets.length === 0 ? (
              <div>No results available.</div>
            ) : (
              <Flex
                sx={{
                  flexDirection: 'column',
                  gap: 5,
                }}
              >
                {!!collectionId && (
                  <Box
                    sx={{
                      width: '100%',
                      flexDirection: 'row',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      variant="h3Primary"
                      color="grey-600"
                      sx={{ display: 'inline-block', mr: 10 }}
                    >
                      NFTs
                    </Text>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        mr: 10,
                      }}
                    >
                      <Text
                        variant="large"
                        color="grey-600"
                        sx={{ marginRight: 2 }}
                      >
                        View as
                      </Text>
                      <IconButton onClick={() => toggleListView(false)}>
                        <Icon
                          color={listView ? 'grey-700' : 'grey-300'}
                          icon={'gridViewV2'}
                          size={32}
                        />
                      </IconButton>
                      <IconButton onClick={() => toggleListView(true)}>
                        <Icon
                          color={listView ? 'grey-300' : 'grey-700'}
                          icon={'listViewV2'}
                          size={32}
                        />
                      </IconButton>
                    </Box>
                    {(!listView || isMobile) && (
                      <ButtonDropdown
                        hideRadio
                        label="Sort by"
                        name="sortBy"
                        onChange={(val) => handleChangeNFTColumnSortRadio(val)}
                        options={sortOptions}
                        value={getDropdownValue()}
                        closeOnSelect={true}
                        style={{
                          display: 'inline-block',
                          marginTop: isMobile ? '10px' : '',
                        }}
                      />
                    )}
                  </Box>
                )}
                {!error && !loading && (
                  <Box sx={{ height: '18px' }}>
                    {!!data?.assetGlobalSearch?.count && (
                      <Text>
                        {formatNumber(data.assetGlobalSearch.count)}{' '}
                        {data.assetGlobalSearch.count === 1 ? 'result' : 'results'}{' '}
                        found
                      </Text>
                    )}
                  </Box>
                )}
                {!collectionId && ready && (
                  <TopCollections
                    variant="normal"
                    searchTerm={collectionSearch}
                    onChangeSelection={handleChangeSelection}
                    {...{ selectedColumn, sortAscending }}
                  />
                )}
                {
                  /* Chunk results into non-wrapping rows. */
                  loading && collectionId ? (
                    listView ? (
                      <NFTSearchResultsSkeleton
                        columns={nftSearchResultsColumns}
                        selectedColumn={selectedNFTColumn}
                        sortAscending={sortNFTsAscending}
                      />
                    ) : (
                      loadArr
                        .map((_, i) =>
                          i % chunkSize === 0
                            ? loadArr.slice(i, i + chunkSize)
                            : null
                        )
                        .filter(Boolean)
                        .map((items, idx) => (
                          <Flex key={idx} sx={{ gap: 5 }}>
                            {items?.map((_, idx) => (
                              <BlurrySquareTemplate key={idx} />
                            ))}
                          </Flex>
                        ))
                    )
                  ) : assetArr && listView ? (
                    <NFTSearchResults
                      assetArr={assetArr}
                      columns={nftSearchResultsColumns}
                      selectedColumn={selectedNFTColumn}
                      sortAscending={sortNFTsAscending}
                      onChangeSelection={handleChangeNFTColumnSelection}
                    />
                  ) : (
                    <Grid
                    sx={{
                      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                      columnGap: '16px',
                      rowGap: '16px', 
                    }}
                    >
                            {assetArr?.map(
                              (
                                {
                                  id,
                                  contractAddress,
                                  mediaUrl,
                                  name,
                                  collection,
                                  latestAppraisal,
                                  listPrice,
                                  listAppraisalRatio,
                                },
                                idx
                              ) => (
                                <Flex key={idx} sx={{ gap: 5 }}>
                                <NFTCard
                                  avatarImage={collectionData?.collectionById?.imageUrl}
                                  imageSrc={mediaUrl}
                                  isPixelated={PIXELATED_CONTRACTS.includes(contractAddress)}
                                  collection={collection?.name ?? ''}
                                  name={name}
                                  listPriceEth={listPrice}
                                  appraisalPriceETH={latestAppraisal?.estimatedPrice}
                                  listAppraisalPercentage={listAppraisalRatio} 
                                  nftUrl={`/analytics/nft/${id}`}
                                  collectionUrl={`/analytics/collection/${collection?.id}`}
                                  />
                                  </Flex>
                              )
                            )}
                    </Grid>
                  )
                }
              </Flex>
            )}

            <Flex sx={{ justifyContent: 'center', width: '100%' }}>
              {!!data?.assetGlobalSearch?.count && (
                <Pagination
                  forcePage={page}
                  pageRangeDisplayed={0}
                  marginPagesDisplayed={isMobile ? 1 : 3}
                  pageCount={Math.ceil(
                    data.assetGlobalSearch.count / (chunkSize * ROW_SIZE)
                  )}
                  onPageChange={handlePageChange}
                />
              )}
            </Flex>
          </Flex>
        </Grid>
      </Container>
      <Footer />
    </>
  )
}
