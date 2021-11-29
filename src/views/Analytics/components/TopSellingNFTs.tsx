/** @jsxImportSource theme-ui */
import { useQuery } from '@apollo/client'
import {
  BlurrySquareTemplate,
  Flex,
  Icon,
  MiniNftCard,
  SwitchDropdown,
  useBreakpointIndex,
} from '@upshot-tech/upshot-ui'
import { PIXELATED_CONTRACTS } from 'constants/'
import { formatDistance } from 'date-fns'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { shortenAddress } from 'utils/address'
import { weiToEth } from 'utils/number'
import Link from 'next/link'

import {
  GET_TOP_SALES,
  GetTopSalesData,
  GetTopSalesVars,
  GetCollectionAvgPriceData,
  GetCollectionAvgPriceVars,
  GET_COLLECTION_AVG_PRICE,
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

function TopSellingNFTsHeader({
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
  const [open, setOpen] = useState(false)
  const [collectionOpen, setCollectionOpen] = useState(false)

  useEffect(() => {
    console.log(open, collectionOpen)
  }, [open, collectionOpen])

  return (
    <Flex
      variant="text.h1Secondary"
      sx={{
        gap: 2,
        alignItems: 'flex-start',
        paddingBottom: '1rem',
        position: 'absolute',
        width: '100%',
        height: open || collectionOpen ? '100%' : 'auto',
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2,
        '&,& *': breakpointIndex <= 1 && {
          fontSize: '1rem!important',
          lineHeight: '1.5rem!important',
        },
      }}
    >
      Top Selling
      {!!setTopSellingType ? (
        <SwitchDropdown
          onChange={(val) => setTopSellingType?.(val)}
          onStatusChange={(status) => {
            setCollectionOpen(status)
          }}
          value={topSellingType ?? ''}
          options={['NFTs', 'Collections']}
        />
      ) : (
        ' '
      )}
      in
      {!!setPeriod ? (
        <SwitchDropdown
          onChange={(val) => setPeriod?.(val)}
          onStatusChange={(status) => {
            setOpen(status)
          }}
          value={period ?? ''}
          options={['1 day', '1 week', '1 month']}
        />
      ) : (
        <></>
      )}
    </Flex>
  )
}

export default function TopSellingNFTs({
  collectionId,
}: {
  collectionId?: number
}) {
  const router = useRouter()
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
  } = useQuery<GetCollectionAvgPriceData, GetCollectionAvgPriceVars>(
    GET_COLLECTION_AVG_PRICE,
    {
      variables: {
        metric: 'VOLUME',
        windowSize:
          period === '1 day' ? 'DAY' : period === '1 week' ? 'WEEK' : 'MONTH',
        limit: 10,
      },
    }
  )

  const handleClickNFT = (id: string) => {
    router.push('/analytics/nft/' + id)
  }

  if (loading || collectionLoading)
    return (
      <>
        <TopSellingNFTsHeader
          period={period}
          setPeriod={(val) => setPeriod(val)}
          topSellingType={topSellingType}
          setTopSellingType={(val) => setTopSellingType(val)}
        />
        <MiniNFTContainer
          sx={{ paddingTop: breakpointIndex <= 1 ? '50px' : '80px' }}
        >
          {[...new Array(10)].map((_, idx) => (
            <BlurrySquareTemplate key={idx} />
          ))}
        </MiniNFTContainer>
      </>
    )

  if (error || collectionError)
    return (
      <>
        <TopSellingNFTsHeader
          period={period}
          setPeriod={(val) => setPeriod(val)}
          topSellingType={topSellingType}
          setTopSellingType={(val) => setTopSellingType(val)}
        />
        There was an error completing your request.
      </>
    )

  if (
    !data?.topSales.length ||
    !collectionData?.orderedCollectionsByMetricSearch?.assetSets.length
  )
    return (
      <Flex
        sx={{
          paddingBottom: '2rem',
          zIndex: 5,
        }}
      >
        <TopSellingNFTsHeader
          period={period}
          setPeriod={(val) => setPeriod(val)}
          topSellingType={topSellingType}
          setTopSellingType={(val) => setTopSellingType(val)}
        />
        <text sx={{ paddingTop: breakpointIndex <= 1 ? '50px' : '80px' }}>
          No results available.{' '}
        </text>
      </Flex>
    )

  return (
    <>
      <TopSellingNFTsHeader
        period={period}
        setPeriod={(val) => setPeriod(val)}
        topSellingType={topSellingType}
        setTopSellingType={(val) => setTopSellingType(val)}
      />
      <MiniNFTContainer
        sx={{ paddingTop: breakpointIndex <= 1 ? '50px' : '80px' }}
      >
        {topSellingType === 'NFTs' ? (
          <>
            {data.topSales.map(
              (
                {
                  txAt,
                  txFromAddress,
                  txToAddress,
                  price,
                  asset: {
                    id,
                    contractAddress,
                    previewImageUrl,
                    mediaUrl,
                    rarity,
                    collection,
                  },
                },
                key
              ) => (
                <a
                  key={key}
                  onClick={() => handleClickNFT(id)}
                  style={{ cursor: 'pointer' }}
                >
                  <MiniNftCard
                    price={price ? weiToEth(price) : undefined}
                    to={shortenAddress(txToAddress, 2, 4)}
                    from={shortenAddress(txFromAddress, 2, 4)}
                    rarity={rarity ? rarity.toFixed(2) + '%' : '-'}
                    image={previewImageUrl ?? mediaUrl}
                    date={formatDistance(txAt * 1000, new Date())}
                    pixelated={PIXELATED_CONTRACTS.includes(contractAddress)}
                    link={`https://app.upshot.io/analytics/collection/${collection?.id}`}
                  />
                </a>
              )
            )}
          </>
        ) : (
          <>
            {collectionData?.orderedCollectionsByMetricSearch.assetSets.map(
              ({ id, name, imageUrl, average, floor, volume }) => (
                <Link key={id} href={`/analytics/collection/${id}`}>
                  <a style={{ textDecoration: 'none' }}>
                    <MiniNftCard
                      tooltip={`volume / ${period}`}
                      price={volume ? weiToEth(volume) : undefined}
                      name={name}
                      type="collection"
                      image={imageUrl}
                      floorPrice={floor ? weiToEth(floor) : undefined}
                      sales={'130'}
                      link={`https://app.upshot.io/analytics/collection/${id}`}
                    />
                  </a>
                </Link>
              )
            )}
          </>
        )}
      </MiniNFTContainer>
    </>
  )
}
