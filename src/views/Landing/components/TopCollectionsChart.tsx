import { useQuery } from '@apollo/client'
import { Chart } from '@upshot-tech/upshot-ui'
import { ethers } from 'ethers'

import {
  GET_TOP_COLLECTIONS,
  GetTopCollectionsData,
  GetTopCollectionsVars,
  TimeSeries,
} from '../queries'
import { METRIC } from './ButtonTabs'

const timeSeriesKeys = {
  AVERAGE: 'average',
  VOLUME: 'marketCap',
  FLOOR: 'floor',
}

export default function TopCollectionsCharts({
  metric,
  selectedCollections,
}: {
  metric: METRIC
  selectedCollections: number[]
}) {
  const { loading, error, data } = useQuery<
    GetTopCollectionsData,
    GetTopCollectionsVars
  >(GET_TOP_COLLECTIONS, {
    errorPolicy: 'all',
    variables: {
      metric,
      stringifiedCollectionIds: selectedCollections.length
        ? `[${selectedCollections.join(',')}]`
        : undefined,
    },
  })
  /* Load state. */
  if (loading) return <Chart loading />

  /* Error state. */
  if (error) return <Chart error />

  /* No results state. */
  if (!data?.orderedCollectionsByMetricSearch?.length) return <Chart noData />

  const assetSets = data.orderedCollectionsByMetricSearch.filter(
    ({ timeSeries }) => timeSeries?.length
  )
  if (!assetSets?.length) return <Chart noData />

  /**
   * Reduce the time series to (timestamp, value) tuples.
   * Wei pricing is converted to rounded floats.
   */
  const chartData = assetSets.map(({ timeSeries, name }) => ({
    name,
    data: (timeSeries as TimeSeries[]).reduce(
      (a: (Date | number)[][], c) => [
        ...a,
        [
          c.timestamp * 1000,
          parseFloat(ethers.utils.formatEther(c[timeSeriesKeys[metric]])),
        ],
      ],
      []
    ),
  }))

  return <Chart data={chartData} />
}