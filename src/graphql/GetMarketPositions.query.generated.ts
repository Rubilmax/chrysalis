import * as Types from "./types";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetUserMarketPositionsQueryVariables = Types.Exact<{
	address: Types.Scalars["String"]["input"];
	chainId: Types.Scalars["Int"]["input"];
}>;

export type GetUserMarketPositionsQuery = {
	__typename?: "Query";
	userByAddress: {
		__typename?: "User";
		id: string;
		marketPositions: Array<{
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
				collateralPrice: Types.Scalars["BigInt"]["output"] | null;
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
				dailyApys: {
					__typename?: "MarketApyAggregates";
					borrowApy: number | null;
					netBorrowApy: number | null;
				} | null;
			};
			user: {
				__typename?: "User";
				id: string;
				address: Types.Scalars["Address"]["output"];
				tag: string | null;
				chain: { __typename?: "Chain"; id: number };
			};
		}>;
	};
};

export const GetUserMarketPositionsDocument = gql`
    query getUserMarketPositions($address: String!, $chainId: Int!) {
  userByAddress(address: $address, chainId: $chainId) {
    id
    marketPositions {
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
        collateralPrice
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
        dailyApys {
          borrowApy
          netBorrowApy
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
 * __useGetUserMarketPositionsQuery__
 *
 * To run a query within a React component, call `useGetUserMarketPositionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserMarketPositionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserMarketPositionsQuery({
 *   variables: {
 *      address: // value for 'address'
 *      chainId: // value for 'chainId'
 *   },
 * });
 */
export function useGetUserMarketPositionsQuery(
	baseOptions: Apollo.QueryHookOptions<
		GetUserMarketPositionsQuery,
		GetUserMarketPositionsQueryVariables
	> &
		(
			| { variables: GetUserMarketPositionsQueryVariables; skip?: boolean }
			| { skip: boolean }
		),
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useQuery<
		GetUserMarketPositionsQuery,
		GetUserMarketPositionsQueryVariables
	>(GetUserMarketPositionsDocument, options);
}
export function useGetUserMarketPositionsLazyQuery(
	baseOptions?: Apollo.LazyQueryHookOptions<
		GetUserMarketPositionsQuery,
		GetUserMarketPositionsQueryVariables
	>,
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useLazyQuery<
		GetUserMarketPositionsQuery,
		GetUserMarketPositionsQueryVariables
	>(GetUserMarketPositionsDocument, options);
}
export function useGetUserMarketPositionsSuspenseQuery(
	baseOptions?: Apollo.SuspenseQueryHookOptions<
		GetUserMarketPositionsQuery,
		GetUserMarketPositionsQueryVariables
	>,
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useSuspenseQuery<
		GetUserMarketPositionsQuery,
		GetUserMarketPositionsQueryVariables
	>(GetUserMarketPositionsDocument, options);
}
export type GetUserMarketPositionsQueryHookResult = ReturnType<
	typeof useGetUserMarketPositionsQuery
>;
export type GetUserMarketPositionsLazyQueryHookResult = ReturnType<
	typeof useGetUserMarketPositionsLazyQuery
>;
export type GetUserMarketPositionsSuspenseQueryHookResult = ReturnType<
	typeof useGetUserMarketPositionsSuspenseQuery
>;
export type GetUserMarketPositionsQueryResult = Apollo.QueryResult<
	GetUserMarketPositionsQuery,
	GetUserMarketPositionsQueryVariables
>;
