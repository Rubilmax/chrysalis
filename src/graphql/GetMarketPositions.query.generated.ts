import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";

import * as Types from "./types";

const defaultOptions = {} as const;
export type GetMarketPositionsQueryVariables = Types.Exact<{
  where?: Types.InputMaybe<Types.MarketPositionFilters>;
  orderBy?: Types.InputMaybe<Types.MarketPositionOrderBy>;
  orderDirection?: Types.InputMaybe<Types.OrderDirection>;
  first?: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  skip?: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
}>;

export type GetMarketPositionsQuery = {
  __typename?: "Query";
  marketPositions: {
    __typename?: "PaginatedMarketPositions";
    items: Array<{
      __typename?: "MarketPosition";
      id: string;
      borrowShares: Types.Scalars["BigInt"]["output"];
      borrowAssets: Types.Scalars["BigInt"]["output"];
      borrowAssetsUsd: number | null;
      collateral: Types.Scalars["BigInt"]["output"];
      collateralUsd: number | null;
      market: {
        __typename?: "Market";
        id: string;
        uniqueKey: Types.Scalars["MarketId"]["output"];
        lltv: Types.Scalars["BigInt"]["output"];
        oracleAddress: Types.Scalars["Address"]["output"];
        irmAddress: Types.Scalars["Address"]["output"];
        morphoBlue: {
          __typename?: "MorphoBlue";
          id: string;
          address: Types.Scalars["Address"]["output"];
          chain: { __typename?: "Chain"; id: number };
        };
        loanAsset: {
          __typename?: "Asset";
          id: string;
          address: Types.Scalars["Address"]["output"];
          symbol: string;
          name: string;
          decimals: number;
          priceUsd: number | null;
        };
        collateralAsset: {
          __typename?: "Asset";
          id: string;
          address: Types.Scalars["Address"]["output"];
          symbol: string;
          name: string;
          decimals: number;
          priceUsd: number | null;
        } | null;
      };
      user: {
        __typename?: "User";
        id: string;
        address: Types.Scalars["Address"]["output"];
        tag: string | null;
        chain: { __typename?: "Chain"; id: number };
      };
    }> | null;
  };
};

export const GetMarketPositionsDocument = gql`
  query getMarketPositions(
    $where: MarketPositionFilters
    $orderBy: MarketPositionOrderBy
    $orderDirection: OrderDirection
    $first: Int
    $skip: Int
  ) {
    marketPositions(first: $first, skip: $skip, where: $where, orderBy: $orderBy, orderDirection: $orderDirection) {
      items {
        id
        borrowShares
        borrowAssets
        borrowAssetsUsd
        collateral
        collateralUsd
        market {
          id
          uniqueKey
          lltv
          oracleAddress
          irmAddress
          morphoBlue {
            id
            address
            chain {
              id
            }
          }
          loanAsset {
            id
            address
            symbol
            name
            decimals
            priceUsd
          }
          collateralAsset {
            id
            address
            symbol
            name
            decimals
            priceUsd
          }
        }
        user {
          id
          address
          tag
          chain {
            id
          }
        }
      }
    }
  }
`;

/**
 * __useGetMarketPositionsQuery__
 *
 * To run a query within a React component, call `useGetMarketPositionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMarketPositionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMarketPositionsQuery({
 *   variables: {
 *      where: // value for 'where'
 *      orderBy: // value for 'orderBy'
 *      orderDirection: // value for 'orderDirection'
 *      first: // value for 'first'
 *      skip: // value for 'skip'
 *   },
 * });
 */
export function useGetMarketPositionsQuery(
  baseOptions?: Apollo.QueryHookOptions<GetMarketPositionsQuery, GetMarketPositionsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetMarketPositionsQuery, GetMarketPositionsQueryVariables>(
    GetMarketPositionsDocument,
    options,
  );
}
export function useGetMarketPositionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetMarketPositionsQuery, GetMarketPositionsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetMarketPositionsQuery, GetMarketPositionsQueryVariables>(
    GetMarketPositionsDocument,
    options,
  );
}
export function useGetMarketPositionsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<GetMarketPositionsQuery, GetMarketPositionsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetMarketPositionsQuery, GetMarketPositionsQueryVariables>(
    GetMarketPositionsDocument,
    options,
  );
}
export type GetMarketPositionsQueryHookResult = ReturnType<typeof useGetMarketPositionsQuery>;
export type GetMarketPositionsLazyQueryHookResult = ReturnType<typeof useGetMarketPositionsLazyQuery>;
export type GetMarketPositionsSuspenseQueryHookResult = ReturnType<typeof useGetMarketPositionsSuspenseQuery>;
export type GetMarketPositionsQueryResult = Apollo.QueryResult<
  GetMarketPositionsQuery,
  GetMarketPositionsQueryVariables
>;
