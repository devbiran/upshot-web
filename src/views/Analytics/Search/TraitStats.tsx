/** @jsxImportSource theme-ui */
import { useQuery } from '@apollo/client'
import {
  CollectorAccordion,
  Icon,
  useBreakpointIndex,
} from '@upshot-tech/upshot-ui'
import { CollectionRow, CollectionTable } from '@upshot-tech/upshot-ui'
import { useTheme } from '@upshot-tech/upshot-ui'
import { Box, Flex, Grid, Text } from '@upshot-tech/upshot-ui'
import {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@upshot-tech/upshot-ui'
import React from 'react'

import { ExplorePanelSkeleton } from '../../Analytics/components/ExplorePanel/NFTs'
import {
  GET_TRAIT_STATS,
  GetTraitStatsData,
  GetTraitStatsVars,
} from './queries'

export enum ETraitStatSearchOrder {
  TRAIT,
  TRAIT_TYPE,
  RARITY,
  FLOOR,
}

export type OrderedTraitStatColumns = {
  [key in keyof typeof ETraitStatSearchOrder]: string
}

interface TraitStatsHeadProps extends React.HTMLAttributes<HTMLElement> {
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
  onChangeSelection?: (colIdx: number) => void
}

export const traitStatsColumns: OrderedTraitStatColumns = {
  TRAIT: 'Trait',
  TRAIT_TYPE: 'Trait Type',
  RARITY: 'Rarity',
  FLOOR: 'Floor',
}

function TraitStatsHead({
  selectedColumn,
  sortAscending,
  onChangeSelection,
}: TraitStatsHeadProps) {
  const breakpointIndex = useBreakpointIndex()
  const isMobile = breakpointIndex <= 1

  const { theme } = useTheme()

  return (
    <>
      {isMobile ? (
        <Box>
          <Flex sx={{ justifyContent: 'space-between', padding: 2 }}>
            <Text></Text>
            <Text>{traitStatsColumns.TRAIT_TYPE}</Text>
          </Flex>
        </Box>
      ) : (
        <TableHead>
          <TableRow>
            {Object.values(traitStatsColumns).map((col, idx) => (
              <TableCell
                key={idx}
                color="grey-500"
                onClick={() => onChangeSelection?.(idx)}
                sx={{
                  cursor: 'pointer',
                  color: selectedColumn === idx ? 'white' : null,
                  transition: 'default',
                  userSelect: 'none',
                  minWidth: 100,
                  '& svg path': {
                    transition: 'default',
                    '&:nth-child(1)': {
                      fill:
                        selectedColumn === idx && sortAscending
                          ? 'white'
                          : theme.rawColors['grey-500'],
                    },
                    '&:nth-child(2)': {
                      fill:
                        !sortAscending && selectedColumn === idx
                          ? 'white'
                          : theme.rawColors['grey-500'],
                    },
                  },
                }}
              >
                <Flex sx={{ alignItems: 'center' }}>
                  <Flex
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '.85rem',
                    }}
                  >
                    {col}
                  </Flex>
                  <Icon icon="tableSort" height={16} width={16} />
                </Flex>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
      )}
    </>
  )
}

const TraitStatsWrapper = ({ children, ...props }: TraitStatsHeadProps) => {
  const breakpointIndex = useBreakpointIndex()
  const isMobile = breakpointIndex <= 1

  return (
    <>
      {isMobile ? (
        <>
          <TraitStatsHead {...props} />
          <CollectorAccordion>{children}</CollectorAccordion>
        </>
      ) : (
        <CollectionTable sx={{ width: 'auto' }}>
          <TraitStatsHead {...props} />
          <TableBody>{children}</TableBody>
        </CollectionTable>
      )}
    </>
  )
}

export default function TraitStats({
  traitIds,
  selectedColumn,
  sortAscending,
  onChangeSelection,
}: {
  traitIds: number[]
  selectedColumn: number
  sortAscending: boolean
  onChangeSelection: (colIdx: number) => void
}) {
  const breakpointIndex = useBreakpointIndex()
  const isMobile = breakpointIndex <= 1

  const { loading, data } = useQuery<GetTraitStatsData, GetTraitStatsVars>(
    GET_TRAIT_STATS,
    {
      errorPolicy: 'ignore',
      variables: {
        traitIds,
      },
    }
  )

  /* Loading state. */
  if (loading)
    return (
      <ExplorePanelSkeleton>
        <TraitStatsHead {...{ selectedColumn, sortAscending }} />
      </ExplorePanelSkeleton>
    )

  if (!data?.traitStats.traits.length) return null

  return (
    <>
      <Text variant="h3Primary">Trait Stats</Text>

      <TraitStatsWrapper
        {...{ selectedColumn, sortAscending, onChangeSelection }}
      >
        {data?.traitStats?.traits.map(
          ({ value, traitType, rarity, floor }, idx) => (
            <CollectionRow
              title={value}
              key={idx}
              defaultOpen={idx === 0 ? true : false}
              variant="normal"
              subtitle={isMobile ? traitType : null}
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
                    <Text sx={{ marginBottom: 1 }}>
                      {traitStatsColumns.TRAIT_TYPE}
                    </Text>
                    <Text>{traitType}</Text>
                  </Flex>
                  <Flex
                    sx={{
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text sx={{ marginBottom: 1 }}>
                      {traitStatsColumns.FLOOR}
                    </Text>
                    <Text>{floor}</Text>
                  </Flex>
                  <Flex
                    sx={{
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text sx={{ textAlign: 'center', marginBottom: 1 }}>
                      {traitStatsColumns.RARITY}
                    </Text>
                    <Text>{rarity}</Text>
                  </Flex>
                </Grid>
              ) : (
                <>
                  <TableCell sx={{ maxWidth: 50 }}>{traitType}</TableCell>
                  <TableCell sx={{ maxWidth: 50 }}>{rarity}</TableCell>
                  <TableCell sx={{ maxWidth: 50 }}>{floor}</TableCell>
                </>
              )}
            </CollectionRow>
          )
        )}
      </TraitStatsWrapper>
    </>
  )
}
