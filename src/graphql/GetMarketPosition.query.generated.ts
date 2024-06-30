import type * as Types from "./types";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetUserMarketPositionQueryVariables = Types.Exact<{
	user: Types.Scalars["String"]["input"];
	market: Types.Scalars["String"]["input"];
	chainId: Types.Scalars["Int"]["input"];
}>;

export type GetUserMarketPositionQuery = {
	__typename?: "Query";
	marketPosition: {
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
	};
};

export const GetUserMarketPositionDocument = gql`
    query getUserMarketPosition($user: String!, $market: String!, $chainId: Int!) {
  marketPosition(userAddress: $user, marketUniqueKey: $market, chainId: $chainId) {
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
    `;

/**
 * __useGetUserMarketPositionQuery__
 *
 * To run a query within a React component, call `useGetUserMarketPositionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserMarketPositionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserMarketPositionQuery({
 *   variables: {
 *      user: // value for 'user'
 *      market: // value for 'market'
 *      chainId: // value for 'chainId'
 *   },
 * });
 */
export function useGetUserMarketPositionQuery(
	baseOptions: Apollo.QueryHookOptions<
		GetUserMarketPositionQuery,
		GetUserMarketPositionQueryVariables
	> &
		(
			| { variables: GetUserMarketPositionQueryVariables; skip?: boolean }
			| { skip: boolean }
		),
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useQuery<
		GetUserMarketPositionQuery,
		GetUserMarketPositionQueryVariables
	>(GetUserMarketPositionDocument, options);
}
export function useGetUserMarketPositionLazyQuery(
	baseOptions?: Apollo.LazyQueryHookOptions<
		GetUserMarketPositionQuery,
		GetUserMarketPositionQueryVariables
	>,
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useLazyQuery<
		GetUserMarketPositionQuery,
		GetUserMarketPositionQueryVariables
	>(GetUserMarketPositionDocument, options);
}
export function useGetUserMarketPositionSuspenseQuery(
	baseOptions?: Apollo.SuspenseQueryHookOptions<
		GetUserMarketPositionQuery,
		GetUserMarketPositionQueryVariables
	>,
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useSuspenseQuery<
		GetUserMarketPositionQuery,
		GetUserMarketPositionQueryVariables
	>(GetUserMarketPositionDocument, options);
}
export type GetUserMarketPositionQueryHookResult = ReturnType<
	typeof useGetUserMarketPositionQuery
>;
export type GetUserMarketPositionLazyQueryHookResult = ReturnType<
	typeof useGetUserMarketPositionLazyQuery
>;
export type GetUserMarketPositionSuspenseQueryHookResult = ReturnType<
	typeof useGetUserMarketPositionSuspenseQuery
>;
export type GetUserMarketPositionQueryResult = Apollo.QueryResult<
	GetUserMarketPositionQuery,
	GetUserMarketPositionQueryVariables
>;
