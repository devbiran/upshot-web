import { useQuery } from '@apollo/client'
import {
  Box,
  ButtonDropdown,
  CollectionGridRow,
  CollectorAccordion,
  Flex,
  formatNumber,
  Grid,
  Icon,
  Pagination,
  Skeleton,
  Text,
  useBreakpointIndex,
  useTheme,
} from '@upshot-tech/upshot-ui'
import { PAGE_SIZE, PIXELATED_CONTRACTS } from 'constants/'
import NextLink from 'next/link'
import router from 'next/router'
import React, { useEffect, useState } from 'react'
import { getPriceChangeColor } from 'utils/color'
import { getUnderOverPricedLabel } from 'utils/number'
import { formatDistance } from 'utils/time'

import {
  genSortOptions,
  getDropdownValue,
  handleChangeNFTColumnSortRadio,
} from '../../../../utils/tableSortDropdown'
import {
  GET_EXPLORE_NFTS,
  GetExploreNFTsData,
  GetExploreNFTsVars,
} from '../../queries'
import { getOrderDirection, lacksGlobalAssetFilters } from './util'

interface NFTTableHeadProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The current selected column index used for sorting.
   */
  selectedColumn: number
  /**
   * Request the results in ascending order.
   */
  sortAscending: boolean
  /**
   * Handler for selection change
   */
  handleChangeSelection: (colIdx: number, order?: 'asc' | 'desc') => void
}

export const nftColumns = {
  LAST_SALE_DATE: 'Last Sale',
  LAST_SALE_PRICE: 'Last Sale Price',
  LAST_APPRAISAL_PRICE: 'Latest Appraisal',
  LAST_APPRAISAL_SALE_RATIO: '% Difference',
}

const colSpacing =
  '46px minmax(100px,3fr) minmax(80px, 1fr) minmax(110px, 1fr) minmax(120px, 1fr) minmax(80px, 1fr) 40px'

export function NFTTableHead({
  selectedColumn,
  sortAscending,
  handleChangeSelection,
}: NFTTableHeadProps) {
  const breakpointIndex = useBreakpointIndex()
  const isMobile = breakpointIndex <= 1
  const { theme } = useTheme()

  return (
    <>
      {!isMobile && (
        <Grid
          columns={colSpacing}
          sx={{ padding: [1, 3].map((n) => theme.space[n] + 'px').join(' ') }}
        >
          <Box />
          <Box />
          {Object.values(nftColumns).map((col, idx) => (
            <Box
              key={idx}
              color="grey-500"
              onClick={() => handleChangeSelection(idx)}
              sx={{
                cursor: 'pointer',
                color: selectedColumn === idx ? 'white' : null,
                transition: 'default',
                userSelect: 'none',
                minWidth: [
                  100,
                  100,
                  100,
                  idx === Object.keys(nftColumns).length - 1 ? 216 : 120,
                  idx === Object.keys(nftColumns).length - 1 ? 216 : 180,
                ],
                '& svg path': {
                  transition: 'default',
                  '&:nth-of-type(1)': {
                    fill:
                      selectedColumn === idx && sortAscending
                        ? 'white'
                        : theme.rawColors['grey-500'],
                  },
                  '&:nth-of-type(2)': {
                    fill:
                      !sortAscending && selectedColumn === idx
                        ? 'white'
                        : theme.rawColors['grey-500'],
                  },
                },
              }}
            >
              <Flex sx={{ alignItems: 'center', gap: 1 }}>
                <Flex
                  sx={{
                    whiteSpace: 'nowrap',
                    fontSize: '.85rem',
                  }}
                >
                  {col}
                </Flex>
                <Icon icon="tableSort" height={16} width={16} />
              </Flex>
            </Box>
          ))}
        </Grid>
      )}
      {isMobile && (
        <ButtonDropdown
          hideRadio
          label="Sort by"
          name="sortBy"
          onChange={(val) =>
            handleChangeNFTColumnSortRadio(
              val,
              nftColumns,
              handleChangeSelection
            )
          }
          options={genSortOptions(nftColumns)}
          value={getDropdownValue(selectedColumn, sortAscending, nftColumns)}
          closeOnSelect={true}
          style={{
            marginTop: '10px',
            marginBottom: '10px',
            zIndex: 1,
            position: 'relative',
          }}
        />
      )}
    </>
  )
}

const handleShowNFT = (id: string) => {
  router.push('/analytics/nft/' + id)
}

export function ExplorePanelSkeleton({
  children,
}: {
  children?: React.ReactNode
}) {
  return (
    <>
      {children}
      <Box>
        {[...new Array(PAGE_SIZE)].map((_, idx) => (
          <Skeleton sx={{ height: 56, margin: '8px 0' }} key={idx} />
        ))}
      </Box>
    </>
  )
}

export const NFTItemsWrapper = ({ children, ...props }: NFTTableHeadProps) => {
  const breakpointIndex = useBreakpointIndex()
  const isMobile = breakpointIndex <= 1

  return (
    <Box sx={{ paddingTop: '8px' }}>
      {isMobile ? (
        <>
          <NFTTableHead {...props} />
          <CollectorAccordion> {children} </CollectorAccordion>
        </>
      ) : (
        <>
          <NFTTableHead {...props} />
          <Box>{children}</Box>
        </>
      )}
    </Box>
  )
}

/**
 *Default render function
 */
export default function ExploreNFTs({
  searchTerm = '',
  collectionId,
  selectedColumn,
  sortAscending,
  onChangeSelection,
}: {
  searchTerm?: string
  collectionId?: number
  selectedColumn: number
  sortAscending: boolean
  onChangeSelection: (colIdx: number, order?: 'asc' | 'desc') => void
}) {
  const breakpointIndex = useBreakpointIndex()
  const isMobile = breakpointIndex <= 1
  const isMobileOrTablet = breakpointIndex <= 2

  const [page, setPage] = useState(0)

  // wrapper function for Pagination change
  const handlePageChange = ({ selected }: { selected: number }) => {
    setPage(selected)
  }

  const handleChangeSelection = (colIdx: number, order?: 'asc' | 'desc') => {
    onChangeSelection(colIdx, order)
    setPage(0)
  }

  const orderColumn = Object.keys(nftColumns)[selectedColumn]
  const orderDirection = getOrderDirection(orderColumn, sortAscending)
  const variables = {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    searchTerm,
    collectionId,
    orderColumn,
    orderDirection,
  }

  const { loading, error, data } = useQuery<
    GetExploreNFTsData,
    GetExploreNFTsVars
  >(GET_EXPLORE_NFTS, {
    errorPolicy: 'all',
    variables,
  })

  /**
   * We are using a workaround at the backend to speed up results for queries
   * which lack filters. The returned asset counts for these queries is
   * unavailable, so we assume 500.
   */
  const returnedAssetCount = data?.assetGlobalSearch?.count ?? 0
  const correctedCount = lacksGlobalAssetFilters(variables)
    ? 500
    : returnedAssetCount

  useEffect(() => {
    setPage(0)
  }, [searchTerm])

  /* Loading state. */
  if (loading)
    return (
      <ExplorePanelSkeleton>
        <NFTTableHead
          {...{ selectedColumn, sortAscending, handleChangeSelection }}
        />
      </ExplorePanelSkeleton>
    )

  /* Error state. */
  // if (error) return <div>There was an error completing your request.</div>

  if (!data?.assetGlobalSearch?.assets?.length)
    return <div>No results available.</div>
  return (
    <>
      <NFTItemsWrapper
        {...{ selectedColumn, sortAscending, handleChangeSelection }}
      >
        {data.assetGlobalSearch.assets.map(
          (
            {
              id,
              name,
              contractAddress,
              mediaUrl,
              lastSale,
              lastAppraisalWeiPrice,
              lastAppraisalSaleRatio,
            },
            idx
          ) => (
            <CollectionGridRow
              variant="black"
              title={name}
              imageSrc={mediaUrl}
              key={idx}
              defaultOpen={idx === 0 ? true : false}
              onClick={() => handleShowNFT(id)}
              pixelated={PIXELATED_CONTRACTS.includes(contractAddress)}
              href={`/analytics/nft/${id}`}
              linkComponent={NextLink}
              columns={colSpacing}
            >
              {isMobile ? (
                <Grid columns={['1fr 1fr']} sx={{ padding: 4 }}>
                  <Flex
                    sx={{
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text sx={{ marginBottom: 1, textAlign: 'center' }}>
                      {nftColumns.LAST_SALE_DATE}
                    </Text>
                    <Text>
                      {lastSale?.timestamp
                        ? formatDistance(lastSale.timestamp * 1000) + ' ago'
                        : '-'}
                    </Text>
                  </Flex>
                  <Flex
                    sx={{
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text sx={{ marginBottom: 1, textAlign: 'center' }}>
                      {nftColumns.LAST_SALE_PRICE}
                    </Text>
                    <Text>
                      {lastSale?.ethSalePrice
                        ? formatNumber(lastSale.ethSalePrice, {
                            decimals: 4,
                            prefix: 'ETHER',
                            fromWei: true,
                          })
                        : '-'}
                    </Text>
                  </Flex>
                  <Flex
                    sx={{
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text sx={{ marginBottom: 1, textAlign: 'center' }}>
                      {nftColumns.LAST_APPRAISAL_PRICE}
                    </Text>
                    <Text>
                      {lastAppraisalWeiPrice
                        ? formatNumber(lastAppraisalWeiPrice, {
                            decimals: 4,
                            prefix: 'ETHER',
                            fromWei: true,
                          })
                        : '-'}
                    </Text>
                  </Flex>
                  <Flex
                    sx={{
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text sx={{ marginBottom: 1, textAlign: 'center' }}>
                      {nftColumns.LAST_APPRAISAL_SALE_RATIO}
                    </Text>
                    <Text
                      sx={{
                        color: getPriceChangeColor(lastAppraisalSaleRatio),
                      }}
                    >
                      {getUnderOverPricedLabel(lastAppraisalSaleRatio)}
                    </Text>
                  </Flex>
                </Grid>
              ) : (
                <>
                  <Box>
                    {lastSale?.timestamp
                      ? formatDistance(lastSale.timestamp * 1000) + ' ago'
                      : '-'}
                  </Box>
                  <Box>
                    {lastSale?.ethSalePrice
                      ? formatNumber(lastSale.ethSalePrice, {
                          decimals: 4,
                          prefix: 'ETHER',
                          fromWei: true,
                        })
                      : '-'}
                  </Box>
                  <Box>
                    {lastAppraisalWeiPrice
                      ? formatNumber(lastAppraisalWeiPrice, {
                          decimals: 4,
                          prefix: 'ETHER',
                          fromWei: true,
                        })
                      : '-'}
                  </Box>
                  <Box
                    sx={{
                      color: getPriceChangeColor(lastAppraisalSaleRatio),
                    }}
                  >
                    {getUnderOverPricedLabel(lastAppraisalSaleRatio)}
                  </Box>
                </>
              )}
            </CollectionGridRow>
          )
        )}
      </NFTItemsWrapper>
      <Flex sx={{ justifyContent: 'center', marginTop: '10px' }}>
        <Pagination
          forcePage={page}
          pageCount={Math.ceil(correctedCount / PAGE_SIZE)}
          pageRangeDisplayed={0}
          marginPagesDisplayed={0}
          onPageChange={handlePageChange}
        />
      </Flex>
    </>
  )
}
