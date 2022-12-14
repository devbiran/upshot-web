import { useQuery } from '@apollo/client'
import { parseUint256 } from '@upshot-tech/upshot-ui'
import { Chart, formatNumber } from '@upshot-tech/upshot-ui'
import { PAGE_SIZE } from 'constants/'
import { ethers } from 'ethers'
import NextLink from 'next/link'
import { useState } from 'react'

import {
  ETimeWindow,
  GET_TOP_COLLECTIONS,
  GetTopCollectionsData,
  GetTopCollectionsVars,
  TimeSeries,
} from '../queries'
import { METRIC } from './ButtonTabs'
import { OrderedAssetColumns } from './ExplorePanel/TopCollections'

interface TopCollectionsChartsProps {
  metric: METRIC
  selectedCollections: number[]
  selectedCollectionsInit: boolean
  onClose?: (index: number) => void
}

const timeSeriesKeys = {
  PAST_WEEK_AVERAGE: 'pastWeekWeiAverage',
  PAST_WEEK_VOLUME: 'pastWeekWeiVolume',
  FLOOR: 'floor',
}

const athKeys = {
  PAST_WEEK_AVERAGE: 'athAverageWeeklyWei',
  PAST_WEEK_VOLUME: 'athVolumeWeeklyWei',
  FLOOR: 'athFloor',
}

const atlKeys = {
  PAST_WEEK_AVERAGE: 'atlAverageWeeklyWei',
  PAST_WEEK_VOLUME: 'atlVolumeWeeklyWei',
  FLOOR: 'atlFloor',
}

export const collectionChartColumns: Partial<OrderedAssetColumns> = {
  PAST_WEEK_VOLUME: 'Weekly Volume',
  PAST_WEEK_AVERAGE: 'Average Price',
  FLOOR: 'Floor Price',
}

const floorCheck = (val) => {
  return val ? parseFloat(ethers.utils.formatEther(val)) : 0
}

export default function TopCollectionsCharts({
  metric,
  selectedCollections,
  selectedCollectionsInit,
  onClose,
}: TopCollectionsChartsProps) {
  const [page, setPage] = useState(0)
  const currentDate = Date.now()
  const before7Daysdate = currentDate - 1000 * 60 * 60 * 24 * 7 // extract 7 days in millisec
  const before90Daysdate = currentDate - 1000 * 60 * 60 * 24 * 90 // extract 90 days in millisec
  const minTimestamp = Math.floor(before90Daysdate / 1000)

  const { loading, error, data } = useQuery<
    GetTopCollectionsData,
    GetTopCollectionsVars
  >(GET_TOP_COLLECTIONS, {
    errorPolicy: 'ignore',
    variables: {
      orderColumn: metric,
      orderDirection: 'ASC',
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      ids: selectedCollections,
      minTimestamp: minTimestamp,
      windowSize: 'WEEK',
    },
    skip: !selectedCollections.length,
  })

  /* Load state. */
  if (selectedCollectionsInit || loading) return <Chart loading />

  /* Error state. */
  // if (error) return <Chart error />

  /* No selected state. */
  if (!selectedCollections.length) return <Chart noSelected />

  /* No results state. */
  if (!data?.searchCollectionByMetric?.assetSets?.length)
    return <Chart noData />

  const assetSets = data.searchCollectionByMetric.assetSets.filter(
    ({ timeSeries }) => timeSeries?.length
  )
  if (!assetSets?.length) return <Chart noData />

  const minDate = Math.min(
    ...assetSets.map(({ timeSeries }) => timeSeries?.[0].timestamp ?? 0)
  )

  /**
   * Reduce the time series to (timestamp, value) tuples.
   * Wei pricing is converted to rounded floats.
   */
  const chartData = assetSets
    .map(({ timeSeries, ...rest }) => ({
      data: (timeSeries as TimeSeries[])
        .filter(({ timestamp }) => timestamp >= minDate)
        .reduce(
          (a: number[][], c) => [
            ...a,
            [c.timestamp * 1000, floorCheck(c[timeSeriesKeys[metric]])],
          ],
          []
        ),
      ...rest,
    }))
    .sort(
      (a, b) =>
        selectedCollections.indexOf(a.id) - selectedCollections.indexOf(b.id)
    )
    .map(({ data, name, id, latestStats, ...rest }) => {
      const ath = rest[athKeys[metric]]?.value
      const atl = rest[atlKeys[metric]]?.value

      return {
        name,
        url: `/analytics/collection/${id}`,
        ath:
          ath && metric !== 'FLOOR'
            ? formatNumber(ath, { fromWei: true, decimals: 2 })
            : undefined,
        atl:
          atl && metric !== 'FLOOR'
            ? formatNumber(atl, { fromWei: true, decimals: 2 })
            : undefined,
        volume:
          metric === 'PAST_WEEK_VOLUME' && latestStats?.pastWeekWeiVolume
            ? Number(ethers.utils.formatEther(latestStats.pastWeekWeiVolume))
            : 0,
        data: data.map((val, i) => ({ x: val[0], y: val[1] })),
        metric,
        currentFloor: latestStats?.floor
          ? parseUint256(latestStats.floor)
          : undefined,
        currentAvg: latestStats?.pastWeekWeiAverage
          ? parseUint256(latestStats.pastWeekWeiAverage)
          : undefined,
        currentVolume: latestStats?.pastWeekWeiVolume
          ? parseUint256(latestStats.pastWeekWeiVolume)
          : undefined,
      }
    })

  return (
    <Chart
      data={chartData}
      linkComponent={NextLink}
      {...{ onClose }}
      height={350}
      margin={{ top: 20, right: 0, bottom: 50, left: 40 }}
    />
  )
}
