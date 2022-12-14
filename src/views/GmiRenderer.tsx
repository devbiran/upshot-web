import { useQuery } from '@apollo/client'
import { Box, Flex, Grid, ProgressBar, Text } from '@upshot-tech/upshot-ui'
import { formatNumber, parseUint256, useTheme } from '@upshot-tech/upshot-ui'
import { format } from 'date-fns'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { shortenAddress } from 'utils/address'
import { gmiLabel, gmiPercentRank } from 'utils/gmi'

import { GET_GMI, GetGmiData, GetGmiVars } from '../graphql/queries'
import { GmiArtwork, GmiScore } from './Gmi'

interface GmiRowProps {
  label: string
  isEth?: boolean
  value?: string | number
  color?: string
}

export interface GmiSocialCardProps {
  displayName: string
  gmi: number
  totalBlueChips: number
  firstPurchase?: number
  tradeVolume: string
  gainsRealized: string
  gainsUnrealized: string
  gainsTotal: number
  totalGainPercent: number
  gmiPercentile: number
}

function GmiRow({ label, isEth, value = '', color = 'grey-500' }: GmiRowProps) {
  const { theme } = useTheme()

  return (
    <Flex sx={{ alignItems: 'baseline' }}>
      <Text
        color="grey-300"
        sx={{ fontSize: '1.67rem', fontWeight: 'heading', lineHeight: 1 }}
      >
        {label}
      </Text>
      <div
        style={{
          flexGrow: 1,
          margin: '0 16px',
          borderBottom: `1px solid ${theme.rawColors['grey-700']}`,
        }}
      ></div>
      <Text
        color={color as keyof typeof theme.colors}
        variant="h3Primary"
        sx={{ fontSize: '1.67rem', fontWeight: 'bold', lineHeight: 1 }}
      >
        {!!isEth && <Text sx={{ fontWeight: '400 !important' }}>Ξ</Text>}
        {value}
      </Text>
    </Flex>
  )
}

export function GmiRenderError({ wallet }: { wallet?: string }) {
  return (
    <Flex
      id="gmiResults"
      sx={{
        minHeight: '100%',
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 40,
        gap: 8,
        overflow: 'hidden',
        background: 'black',
      }}
    >
      <Flex sx={{ flexDirection: 'column' }}>
        <Flex sx={{ justifyContent: 'space-between' }}>
          <Text variant="h1Primary" sx={{ fontSize: 7 }}>
            Failure to launch
          </Text>
        </Flex>

        <Flex sx={{ marginBottom: 5 }}>
          <GmiScore gmi={0} />
        </Flex>

        <Grid
          sx={{ gridTemplateColumns: ['1fr', '1fr', '1.5fr 1fr'], flexGrow: 1 }}
        >
          <Flex sx={{ flexDirection: 'column', gap: 5 }}>
            <Flex sx={{ flexDirection: 'column', gap: 5, marginBottom: 5 }}>
              <ProgressBar percent={0} bgColor="grey-900" />
            </Flex>
            <GmiRow label="Blue Chips Owned" color="blue" value="-" />
            <GmiRow label="First Purchase" color="blue" value="-" />
            <GmiRow isEth label="Wallet Rank" color="blue" value="-" />
            <GmiRow isEth label="Trade Volume" color="blue" value="-" />
            <GmiRow isEth label="Total Gains" color="white" value="-" />
            <GmiRow isEth label="ROI" color="white" value="-" />
          </Flex>
          <Flex sx={{ flexDirection: 'column' }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: 'auto',
                flexGrow: 1,
              }}
            >
              <GmiArtwork gmi={0} />
            </Box>
          </Flex>
        </Grid>
      </Flex>
      <Flex sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <img src="/img/upshot_logo_white.svg" width={140} alt="Upshot Logo" />
        <Text color="grey-500" sx={{ fontSize: 3 }}>
          upshot.xyz/gmi
        </Text>
      </Flex>
    </Flex>
  )
}

export function GmiSocialCard({
  displayName,
  gmi,
  totalBlueChips,
  firstPurchase,
  tradeVolume,
  gainsTotal,
  totalGainPercent,
  gmiPercentile,
}: GmiSocialCardProps) {
  const rank = gmiLabel(gmi)
  const [width, setWidth] = useState<number>()
  const aspectRatio = 0.55

  useEffect(() => {
    const updateSize = () => {
      const el =
        document.getElementById('gmiResults')?.parentElement?.parentElement
      const width = el?.offsetWidth
      if (!width) return

      setWidth(width)
    }

    updateSize()

    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const [isTop, percentRank] = gmiPercentRank(gmiPercentile)
  const percentRankLabel = `${isTop ? 'Top' : 'Bottom'} ${percentRank}%`

  return (
    <Box
      sx={{
        width: width ?? 'auto',
        height: width ? Number(width) * aspectRatio : 'auto',
        overflow: 'hidden',
        maxWidth: 'calc(100vw - 102px)',
      }}
    >
      <Flex
        id="gmiResults"
        sx={{
          width: '100%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 40,
          gap: 8,
          overflow: 'hidden',
          background: 'black',
          transform: `scale(${Number(width) / 1200})`,
          transformOrigin: 'top left',
          minWidth: width ? 1200 : 'auto',
          minHeight: width ? 1200 * aspectRatio : 'auto',
        }}
      >
        <Flex sx={{ flexDirection: 'column' }}>
          <Flex sx={{ justifyContent: 'space-between', marginBottom: 2 }}>
            <Text variant="h1Primary" sx={{ fontSize: 8 }}>
              {rank}
            </Text>
            <Text color="grey-500" sx={{ fontSize: 3, textAlign: 'right' }}>
              {displayName}
            </Text>
          </Flex>

          <Flex sx={{ marginBottom: 5 }}>
            <GmiScore {...{ gmi }} />
          </Flex>

          <Grid
            sx={{
              gridTemplateColumns: '1.5fr 1fr',
              flexGrow: 1,
            }}
          >
            <Flex sx={{ flexDirection: 'column', gap: 5 }}>
              <Flex sx={{ flexDirection: 'column', gap: 5, marginBottom: 5 }}>
                <ProgressBar percent={(gmi / 1000) * 100} bgColor="grey-900" />
              </Flex>
              <GmiRow
                label="Blue Chips Owned"
                color="blue"
                value={totalBlueChips}
              />
              <GmiRow
                label="First Purchase"
                color="blue"
                value={
                  firstPurchase ? format(firstPurchase * 1000, 'M/d/yyyy') : '-'
                }
              />
              <GmiRow
                label="Wallet Rank"
                color={'blue'}
                value={percentRankLabel}
              />
              <GmiRow
                isEth
                label="Trade Volume"
                color="blue"
                value={formatNumber(tradeVolume, {
                  fromWei: true,
                  decimals: 2,
                })}
              />
              <GmiRow
                isEth
                label="Total Gains"
                color={!gainsTotal ? 'white' : gainsTotal > 0 ? 'green' : 'red'}
                value={formatNumber(gainsTotal, {
                  decimals: 2,
                })}
              />
              <GmiRow
                label="ROI"
                color={Number(totalGainPercent) > 0 ? 'green' : 'red'}
                value={`${
                  totalGainPercent && totalGainPercent > 0 ? '+' : ''
                }${totalGainPercent?.toFixed(2)}%`}
              />
            </Flex>
            <Flex sx={{ flexDirection: 'column' }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 'auto',
                  flexGrow: 1,
                }}
              >
                <GmiArtwork {...{ gmi }} />
              </Box>
            </Flex>
          </Grid>
        </Flex>
        <Flex sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <img src="/img/upshot_logo_white.png" width={140} alt="Upshot Logo" />
          <Text color="grey-500" sx={{ fontSize: 3 }}>
            upshot.xyz/gmi
          </Text>
        </Flex>
      </Flex>
    </Box>
  )
}

export default function GmiRenderer() {
  const router = useRouter()
  const [wallet, setWallet] = useState('')

  const { loading, error, data } = useQuery<GetGmiData, GetGmiVars>(GET_GMI, {
    errorPolicy: 'all',
    fetchPolicy: 'no-cache',
    variables: {
      address: wallet.startsWith('0x') ? wallet : undefined,
      ens: wallet.endsWith('.eth') ? wallet : undefined,
    },
    skip: !wallet,
  })

  useEffect(() => {
    const urlAddress = (router.query['wallet'] as string) || ''

    setWallet(urlAddress)
  }, [router.query])

  if (error || (data && !data?.getUser?.addresses?.length))
    return (
      <Flex sx={{ minHeight: '100vh', minWidth: '100vw' }}>
        <GmiRenderError {...{ wallet }} />
      </Flex>
    )
  if (loading || !data) return null

  const userAddr = data?.getUser?.addresses?.[0]?.address
  const userEns = data?.getUser?.addresses?.[0]?.ens
  const displayName = userEns || (userAddr ? shortenAddress(userAddr) : '-')
  const gmi = data?.getUser?.addresses?.[0]?.gmi ?? 0
  const totalBlueChips = data?.getUser?.addresses?.[0]?.numBlueChipsOwned ?? 0
  const firstPurchase = data?.getUser?.addresses?.[0]?.startAt
  const tradeVolume = data?.getUser?.addresses?.[0]?.volume ?? '0'
  const gainsRealized = data?.getUser?.addresses?.[0]?.realizedGain ?? '0'
  const gainsUnrealized = data?.getUser?.addresses?.[0]?.unrealizedGain ?? '0'
  const gainsTotal =
    parseUint256(data?.getUser?.addresses?.[0]?.realizedGain ?? '0') +
    parseUint256(data?.getUser?.addresses?.[0]?.unrealizedGain ?? '0')
  const totalGainPercent = data?.getUser?.addresses?.[0]?.totalGainPercent ?? 0
  const gmiPercentile = data?.getUser?.addresses?.[0]?.gmiPercentile ?? 100

  return (
    <Flex sx={{ minHeight: '100vh', minWidth: '100vw' }}>
      <GmiSocialCard
        {...{
          displayName,
          gmi,
          totalBlueChips,
          firstPurchase,
          tradeVolume,
          gainsRealized,
          gainsUnrealized,
          gainsTotal,
          totalGainPercent,
          gmiPercentile,
        }}
      />
    </Flex>
  )
}
