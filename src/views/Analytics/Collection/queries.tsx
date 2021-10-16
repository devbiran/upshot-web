import { gql } from '@apollo/client'

/**
 * Get Collection
 */

export type GetCollectionVars = {
  id: number
}

export type GetCollectionData = {
  collectionById: {
    name: string
    description: string
    imageUrl: string
    ceil: string
    size: string
    average: string
    totalVolume: string
  }
}

export const GET_COLLECTION = gql`
  query GetCollectionById($id: Int!) {
    collectionById(id: $id) {
      name
      description
      imageUrl
      ceil
      size
      average
      totalVolume
    }
  }
`

/**
 * Get All Collection Sales
 */

export type GetAllCollectionSalesVars = {
  id: number
}

export type GetAllCollectionSalesData = {
  collectionById: {
    allSaleEvents?: {
      ethSalePrice: string
      timestamp: number
    }[]
  }
}

export const GET_ALL_COLLECTION_SALES = gql`
  query GetAllCollectionSales($id: Int!) {
    collectionById(id: $id) {
      allSaleEvents {
        timestamp
        ethSalePrice
      }
    }
  }
`
