import type * as Types from "./types";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetUserMarketPositionSummariesQueryVariables = Types.Exact<{
	user: Types.Scalars["String"]["input"];
	chainId: Types.Scalars["Int"]["input"];
}>;

export type GetUserMarketPositionSummariesQuery = {
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
				morphoBlue: {
					__typename?: "MorphoBlue";
					id: string;
					address: Types.Scalars["Address"]["output"];
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
				dailyApys: {
					__typename?: "MarketApyAggregates";
					borrowApy: number | null;
					netBorrowApy: number | null;
				} | null;
				weeklyApys: {
					__typename?: "MarketApyAggregates";
					borrowApy: number | null;
					netBorrowApy: number | null;
				} | null;
				monthlyApys: {
					__typename?: "MarketApyAggregates";
					borrowApy: number | null;
					netBorrowApy: number | null;
				} | null;
				state: {
					__typename?: "MarketState";
					borrowApy: number;
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

export const GetUserMarketPositionSummariesDocument = gql`
    query getUserMarketPositionSummaries($user: String!, $chainId: Int!) {
  userByAddress(address: $user, chainId: $chainId) {
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
        morphoBlue {
          id
          address
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
        dailyApys {
          borrowApy
          netBorrowApy
        }
        weeklyApys {
          borrowApy
          netBorrowApy
        }
        monthlyApys {
          borrowApy
          netBorrowApy
        }
        state {
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
 * __useGetUserMarketPositionSummariesQuery__
 *
 * To run a query within a React component, call `useGetUserMarketPositionSummariesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserMarketPositionSummariesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserMarketPositionSummariesQuery({
 *   variables: {
 *      user: // value for 'user'
 *      chainId: // value for 'chainId'
 *   },
 * });
 */
export function useGetUserMarketPositionSummariesQuery(
	baseOptions: Apollo.QueryHookOptions<
		GetUserMarketPositionSummariesQuery,
		GetUserMarketPositionSummariesQueryVariables
	> &
		(
			| {
					variables: GetUserMarketPositionSummariesQueryVariables;
					skip?: boolean;
			  }
			| { skip: boolean }
		),
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useQuery<
		GetUserMarketPositionSummariesQuery,
		GetUserMarketPositionSummariesQueryVariables
	>(GetUserMarketPositionSummariesDocument, options);
}
export function useGetUserMarketPositionSummariesLazyQuery(
	baseOptions?: Apollo.LazyQueryHookOptions<
		GetUserMarketPositionSummariesQuery,
		GetUserMarketPositionSummariesQueryVariables
	>,
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useLazyQuery<
		GetUserMarketPositionSummariesQuery,
		GetUserMarketPositionSummariesQueryVariables
	>(GetUserMarketPositionSummariesDocument, options);
}
export function useGetUserMarketPositionSummariesSuspenseQuery(
	baseOptions?: Apollo.SuspenseQueryHookOptions<
		GetUserMarketPositionSummariesQuery,
		GetUserMarketPositionSummariesQueryVariables
	>,
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useSuspenseQuery<
		GetUserMarketPositionSummariesQuery,
		GetUserMarketPositionSummariesQueryVariables
	>(GetUserMarketPositionSummariesDocument, options);
}
export type GetUserMarketPositionSummariesQueryHookResult = ReturnType<
	typeof useGetUserMarketPositionSummariesQuery
>;
export type GetUserMarketPositionSummariesLazyQueryHookResult = ReturnType<
	typeof useGetUserMarketPositionSummariesLazyQuery
>;
export type GetUserMarketPositionSummariesSuspenseQueryHookResult = ReturnType<
	typeof useGetUserMarketPositionSummariesSuspenseQuery
>;
export type GetUserMarketPositionSummariesQueryResult = Apollo.QueryResult<
	GetUserMarketPositionSummariesQuery,
	GetUserMarketPositionSummariesQueryVariables
>;
