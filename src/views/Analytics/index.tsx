import { Box, Container } from '@upshot-tech/upshot-ui'
import { Flex, Text } from '@upshot-tech/upshot-ui'
import { Footer } from 'components/Footer'
import { Nav } from 'components/Nav'
import { useEffect, useState } from 'react'

import ButtonTabs, { METRIC } from './components/ButtonTabs'
import CollectionAvgPricePanel from './components/CollectionAvgPricePanel'
import ExplorePanel from './components/ExplorePanel'
import TopCollectionsChart from './components/TopCollectionsChart'
import TopSellingCollectionNFTs from './components/TopSellingCollectionNFTs'

const selectedCollectionsColors = ['blue', 'pink', 'orange', 'green', 'yellow']

export default function AnalyticsView() {
  const [chartMetric, setChartMetric] = useState<METRIC>('PAST_WEEK_VOLUME')
  /* Selected collections are [] by default.
     <CollectionAvgPricePanel> will load the top collections and select the
     three biggest. We need to wait for the first query (top collections)
     to finish before we make the second (chart loading) query.
     While we wait, lets call it initial state: it will be stored in
     the selectedCollectionsInit state variable */
  const [selectedCollections, setSelectedCollections] = useState<number[]>([])
  const [selectedCollectionsInit, setSelectedCollectionsInit] = useState(true)
  const [colorCycleIndex, setColorCycleIndex] = useState(3)

  useEffect(() => {
    /* set the initial (await for first query) state false since the first
    query (getting top collections) should be finished when
    <CollectionAvgPricePanel> selects the top colelctions */
    if (selectedCollections.length) setSelectedCollectionsInit(false)
  }, [selectedCollections])

  const handleChange = (updatedChartMetric: METRIC) => {
    setChartMetric(updatedChartMetric)
  }

  const handleCollectionSelected = (id: number) => {
    // Removing an existing item
    if (selectedCollections.includes(id)) {
      const updatedCollections = selectedCollections.filter((_id) => _id !== id)

      setColorCycleIndex(updatedCollections.length)

      return setSelectedCollections(updatedCollections)
    }

    // Appending a new item
    const updatedCollections =
      selectedCollections.length < selectedCollectionsColors.length
        ? [...selectedCollections, id]
        : [
            ...selectedCollections.slice(0, colorCycleIndex),
            id,
            ...selectedCollections.slice(
              colorCycleIndex + 1,
              selectedCollections.length
            ),
          ]

    setSelectedCollections(updatedCollections)
    setColorCycleIndex((curr) => (curr + 1) % selectedCollectionsColors.length)
  }

  const handleClose = (index: number) => {
    setSelectedCollections([
      ...selectedCollections.slice(0, index),
      ...selectedCollections.slice(index + 1, selectedCollections.length),
    ])
  }

  return (
    <>
      <Nav />
      <Container
        maxBreakpoint="lg"
        sx={{
          flexDirection: 'column',
          minHeight: '100vh',
          gap: 5,
          padding: 4,
          paddingBottom: '100px',
        }}
      >
        <Flex
          sx={{
            flexDirection: 'column',
            paddingBottom: 0,
            marginTop: '-2px',
            '@media screen and (min-width: 320px)': {
              flexDirection: 'row',
              paddingDirection: '10px',
            },
          }}
        >
          <Text
            variant="h0Secondary"
            sx={{
              lineHeight: '3.5rem',
              color: 'blue',
              fontWeight: '700',
              fontSize: ['42px', 8],
              textTransform: 'uppercase',
            }}
          >
            Upshot
          </Text>
          <Flex>
            <Text
              variant="h0Secondary"
              sx={{
                lineHeight: '3.5rem',
                fontWeight: '500',
                fontSize: ['42px', 8],
              }}
            >
              Analytics
            </Text>
            <Box sx={{ p: [1, 2] }}>
              <Text
                sx={{
                  textTransform: 'uppercase',
                  color: 'black',
                  backgroundColor: 'blue',
                  borderRadius: 'xs',
                  padding: '4px 8px',
                  fontSize: ['9px', 2],
                  fontWeight: 'bold',
                  lineHeight: 1,
                }}
              >
                Beta
              </Text>
            </Box>
          </Flex>
        </Flex>
        <Flex
          sx={{
            flex: '1 1 auto',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <ButtonTabs onChange={handleChange} />
          <TopCollectionsChart
            metric={chartMetric}
            onClose={handleClose}
            {...{ selectedCollections, selectedCollectionsInit }}
          />
          <CollectionAvgPricePanel
            metric={chartMetric}
            onCollectionSelected={handleCollectionSelected}
            {...{
              colorCycleIndex,
              selectedCollections,
              setSelectedCollections,
              selectedCollectionsColors,
            }}
          />
          <Box sx={{ position: 'relative' }}>
            <TopSellingCollectionNFTs />
          </Box>
          <ExplorePanel />
        </Flex>
      </Container>
      <Footer />
    </>
  )
}
