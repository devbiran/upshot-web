/** @jsxImportSource theme-ui */
import { useQuery } from '@apollo/client'
import {
  BlurrySquareTemplate,
  Box,
  Flex,
  formatNumber,
  MiniNftCard,
  SwitchDropdown,
  Text,
  useBreakpointIndex,
} from '@upshot-tech/upshot-ui'
import { PIXELATED_CONTRACTS } from 'constants/'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { shortenAddress } from 'utils/address'
import { formatDistance } from 'utils/time'

import { GET_TOP_SALES, GetTopSalesData, GetTopSalesVars } from '../queries'
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
}: {
  period?: string
  setPeriod?: (val: string) => void
}) {
  const breakpointIndex = useBreakpointIndex()
  const [open, setOpen] = useState(false)

  return (
    <Box
      variant="text.h1Secondary"
      sx={{
        gap: 2,
        alignItems: 'flex-start',
        paddingBottom: '1rem',
        position: 'absolute',
        width: '100%',
        height: open ? '100%' : 'auto',
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2,
        '&,& *': breakpointIndex <= 1 && {
          lineHeight: '2rem !important',
        },
      }}
    >
      Top Selling NFTs in
      {!!setPeriod ? (
        <SwitchDropdown
          onValueChange={(val) => setPeriod?.(val)}
          onToggle={(status) => {
            setOpen(status)
          }}
          value={period ?? ''}
          options={['1 day', '1 week', '1 month']}
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

export default function TopSellingNFTs({
  collectionId,
}: {
  collectionId?: number
}) {
  const router = useRouter()
  const [period, setPeriod] = useState('1 day')
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

  useEffect(() => {
    if (!loading && !data?.topSales.length) {
      if (period === '1 day') {
        setPeriod('1 week')
      } else if (period === '1 week') {
        setPeriod('1 month')
      }
    }
  }, [loading])

  if (loading)
    return (
      <>
        <TopSellingNFTsHeader
          period={period}
          setPeriod={(val) => setPeriod(val)}
        />
        <MiniNFTContainer sx={{ paddingTop: '80px', height: '255px' }}>
          {[...new Array(10)].map((_, idx) => (
            <BlurrySquareTemplate key={idx} />
          ))}
        </MiniNFTContainer>
      </>
    )

  // if (error)
  //   return (
  //     <>
  //       <TopSellingNFTsHeader
  //         period={period}
  //         setPeriod={(val) => setPeriod(val)}
  //       />
  //       There was an error completing your request.
  //     </>
  //   )

  if (!data?.topSales.length)
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
        />
        <Text sx={{ paddingTop: '80px' }}>No results available. </Text>
      </Flex>
    )

  return (
    <>
      <TopSellingNFTsHeader
        period={period}
        setPeriod={(val) => setPeriod(val)}
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
            WebkitMaskImage:
              'linear-gradient(to right, rgba(0, 0, 0, 0) 85%, rgba(0,0,0,1) 100%);',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        ></Box>
        <MiniNFTContainer sx={{ paddingTop: '80px', height: '255px' }}>
          <Flex sx={{ minWidth: 'auto', gap: 'inherit' }}>
            {data.topSales.map(
              (
                {
                  txAt,
                  txFromAddress,
                  txToAddress,
                  ethSalePrice,
                  asset: { id, contractAddress, mediaUrl, rarity, collection },
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
                  nftLink={'/analytics/nft/' + id}
                />
              )
            )}
          </Flex>
        </MiniNFTContainer>
      </Box>
    </>
  )
}
