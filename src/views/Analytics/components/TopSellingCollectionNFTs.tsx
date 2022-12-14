/** @jsxImportSource theme-ui */
import { useQuery } from '@apollo/client'
import {
  BlurrySquareTemplate,
  Box,
  Flex,
  formatNumber,
  Link,
  MiniNftCard,
  SwitchDropdown,
  useBreakpointIndex,
} from '@upshot-tech/upshot-ui'
import { PIXELATED_CONTRACTS } from 'constants/'
import { BigNumber as BN } from 'ethers'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { shortenAddress } from 'utils/address'

import { formatDistance } from '../../../utils/time'
import {
  GET_COLLECTIONS_BY_METRIC,
  GET_TOP_SALES,
  GetCollectionsByMetricData,
  GetCollectionsByMetricVars,
  GetTopSalesData,
  GetTopSalesVars,
} from '../queries'
import { MiniNFTContainer } from './Styled'

export const WINDOWS = {
  HOUR: '1 Hour',
  DAY: '1 Day',
  WEEK: '1 Week',
  MONTH: '1 Month',
  ALLTIME: 'All time',
}

export type WINDOW = keyof typeof WINDOWS

function TopSellingCollectionNFTsHeader({
  period,
  setPeriod,
  topSellingType,
  setTopSellingType,
}: {
  period?: string
  setPeriod?: (val: string) => void
  topSellingType?: string
  setTopSellingType?: (val: string) => void
}) {
  const breakpointIndex = useBreakpointIndex()
  const [assetTypeOpen, setAssetTypeOpen] = useState(false)
  const [timeframeOpen, setTimeframeOpen] = useState(false)

  return (
    <Box
      variant="text.h1Secondary"
      sx={{
        gap: 2,
        alignItems: 'flex-start',
        paddingBottom: breakpointIndex <= 1 ? '0rem' : '1rem',
        marginTop: '0rem',
        position: 'absolute',
        width: '100%',
        height: assetTypeOpen || timeframeOpen ? '100%' : 'auto',
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2,
        '&,& *': breakpointIndex <= 1 && {
          lineHeight: '2rem !important',
        },
      }}
    >
      Top Selling
      {!!setTopSellingType ? (
        <SwitchDropdown
          onValueChange={(val) => setTopSellingType?.(val)}
          onToggle={(status) => {
            setAssetTypeOpen(status)
            setTimeframeOpen(false)
          }}
          value={topSellingType ?? ''}
          options={['NFTs', 'Collections']}
          defaultOpen={assetTypeOpen}
          sx={{
            display: 'inline-block',
            marginLeft: '0.3rem',
            marginRight: '0.3rem',
          }}
        />
      ) : (
        ' '
      )}
      in
      {!!setPeriod ? (
        <SwitchDropdown
          onValueChange={(val) => setPeriod?.(val)}
          onToggle={(status) => {
            setTimeframeOpen(status)
            setAssetTypeOpen(false)
          }}
          value={period ?? ''}
          options={['1 day', '1 week', '1 month']}
          defaultOpen={timeframeOpen}
          sx={{
            display: 'inline-block',
            marginLeft: '0.3rem',
            marginRight: '0.3rem',
          }}
        />
      ) : (
        <></>
      )}
    </Box>
  )
}

export default function TopSellingCollectionNFTs({
  collectionId,
}: {
  collectionId?: number
}) {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [period, setPeriod] = useState('1 day')
  const [topSellingType, setTopSellingType] = useState('NFTs')
  const breakpointIndex = useBreakpointIndex()
  const { loading, error, data } = useQuery<GetTopSalesData, GetTopSalesVars>(
    GET_TOP_SALES,
    {
      errorPolicy: 'all',
      variables: {
        limit: 10,
        windowSize:
          period === '1 day' ? 'DAY' : period === '1 week' ? 'WEEK' : 'MONTH',
        collectionId,
      },
    }
  ) // Using `all` to include data with errors.

  const {
    loading: collectionLoading,
    error: collectionError,
    data: collectionData,
  } = useQuery<GetCollectionsByMetricData, GetCollectionsByMetricVars>(
    GET_COLLECTIONS_BY_METRIC,
    {
      errorPolicy: 'all',
      variables: {
        orderColumn:
          period === '1 month'
            ? 'PAST_MONTH_VOLUME'
            : period === '1 week'
            ? 'PAST_WEEK_VOLUME'
            : 'PAST_DAY_VOLUME',
        orderDirection: 'DESC',
        limit: 100,
        offset: page * 100,
      },
    }
  )

  if (loading || collectionLoading)
    return (
      <>
        <TopSellingCollectionNFTsHeader
          period={period}
          setPeriod={(val) => setPeriod(val)}
          topSellingType={topSellingType}
          setTopSellingType={(val) => setTopSellingType(val)}
        />
        <MiniNFTContainer sx={{ paddingTop: '80px', height: '255px' }}>
          {[...new Array(10)].map((_, idx) => (
            <BlurrySquareTemplate key={idx} />
          ))}
        </MiniNFTContainer>
      </>
    )

  // if (error || collectionError)
  //   return (
  //     <>
  //       <TopSellingCollectionNFTsHeader
  //         period={period}
  //         setPeriod={(val) => setPeriod(val)}
  //         topSellingType={topSellingType}
  //         setTopSellingType={(val) => setTopSellingType(val)}
  //       />
  //       There was an error completing your request.
  //     </>
  //   )

  if (
    !data?.topSales.length ||
    !collectionData?.searchCollectionByMetric?.assetSets.length
  ) {
    return (
      <Flex
        sx={{
          paddingBottom: '2rem',
          zIndex: 5,
        }}
      >
        <TopSellingCollectionNFTsHeader
          period={period}
          setPeriod={(val) => setPeriod(val)}
          topSellingType={topSellingType}
          setTopSellingType={(val) => setTopSellingType(val)}
        />
        <text sx={{ paddingTop: '80px' }}>No results available. </text>
      </Flex>
    )
  }

  const getSalesNumber = (state) => {
    if (!state) return undefined
    switch (period) {
      case '1 day':
        return state.pastDayWeiAverage
          ? `${BN.from(state.pastDayWeiVolume)
              .div(BN.from(state.pastDayWeiAverage))
              .toNumber()}`
          : '0'
      case '1 week':
        return state.pastWeekWeiAverage
          ? `${BN.from(state.pastWeekWeiVolume)
              .div(BN.from(state.pastWeekWeiAverage))
              .toNumber()}`
          : '0'
      case '1 month':
        return `${state.pastMonthNumTxs}`
    }
  }

  const getPeriodPrice = (state) => {
    if (!state) return undefined

    switch (period) {
      case '1 day':
        return state.pastDayWeiVolume
      case '1 week':
        return state.pastWeekWeiVolume
      case '1 month':
        return state.pastMonthWeiVolume
    }
  }

  return (
    <>
      <TopSellingCollectionNFTsHeader
        period={period}
        setPeriod={(val) => setPeriod(val)}
        topSellingType={topSellingType}
        setTopSellingType={(val) => setTopSellingType(val)}
      />
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute',
            top: '80px',
            left: 0,
            width: '100%',
            background: 'black',
            height: 'calc(100% - 80px)',
            WebkitMaskImage: `linear-gradient(to right, rgba(0, 0, 0, 0) 85%, rgba(0,0,0,1) 100%);`,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        ></Box>
        <MiniNFTContainer sx={{ paddingTop: '80px', height: '255px' }}>
          <Flex sx={{ minWidth: 'auto', gap: 'inherit' }}>
            {topSellingType === 'NFTs' ? (
              <>
                {data.topSales.map(
                  (
                    {
                      txAt,
                      txFromAddress,
                      txToAddress,
                      ethSalePrice,
                      asset: {
                        id,
                        contractAddress,
                        mediaUrl,
                        rarity,
                        collection,
                      },
                    },
                    key
                  ) => (
                    <MiniNftCard
                      key={key}
                      price={
                        ethSalePrice
                          ? formatNumber(ethSalePrice, {
                              fromWei: true,
                              decimals: 2,
                              prefix: 'ETHER',
                            })
                          : undefined
                      }
                      linkComponent={NextLink}
                      to={shortenAddress(txToAddress, 2, 4)}
                      toLink={`/analytics/user/${txToAddress}`}
                      from={shortenAddress(txFromAddress, 2, 4)}
                      fromLink={`/analytics/user/${txFromAddress}`}
                      rarity={rarity ? rarity.toFixed(2) + '%' : '-'}
                      image={mediaUrl}
                      date={formatDistance(txAt * 1000)}
                      pixelated={PIXELATED_CONTRACTS.includes(contractAddress)}
                      collectionLink={`/analytics/collection/${collection?.id}`}
                      nftLink={'/analytics/nft/' + id}
                    />
                  )
                )}
              </>
            ) : (
              <>
                {collectionData?.searchCollectionByMetric.assetSets?.map(
                  ({ id, name, imageUrl, latestStats }) => (
                    <MiniNftCard
                      key={id}
                      tooltip={`volume / ${period}`}
                      price={
                        getPeriodPrice(latestStats)
                          ? formatNumber(getPeriodPrice(latestStats), {
                              fromWei: true,
                              kmbUnits: true,
                              decimals: 2,
                              prefix: 'ETHER',
                            })
                          : undefined
                      }
                      linkComponent={NextLink}
                      name={name}
                      type="collection"
                      image={imageUrl}
                      floorPrice={
                        latestStats?.floor
                          ? formatNumber(latestStats.floor, { fromWei: true })
                          : undefined
                      }
                      sales={
                        getSalesNumber(latestStats) +
                        ' / ' +
                        (period === '1 month'
                          ? '1 mth'
                          : period === '1 week'
                          ? '1 wk'
                          : '1 d')
                      }
                      collectionLink={`/analytics/collection/${id}`}
                      nftLink={`/analytics/collection/${id}`}
                    />
                  )
                )}
              </>
            )}
          </Flex>
        </MiniNFTContainer>
      </Box>
    </>
  )
}
