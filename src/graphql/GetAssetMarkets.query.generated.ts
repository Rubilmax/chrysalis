import type * as Types from "./types";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetAssetMarketsQueryVariables = Types.Exact<{
	asset: Types.Scalars["String"]["input"];
	chainId: Types.Scalars["Int"]["input"];
}>;

export type GetAssetMarketsQuery = {
	__typename?: "Query";
	markets: {
		__typename?: "PaginatedMarkets";
		items: Array<{
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
				supplyAssets: Types.Scalars["BigInt"]["output"];
				borrowAssets: Types.Scalars["BigInt"]["output"];
			} | null;
			warnings: Array<{
				__typename?: "MarketWarning";
				type: string;
				level: Types.WarningLevel;
			}> | null;
		}> | null;
	};
};

export const GetAssetMarketsDocument = gql`
    query getAssetMarkets($asset: String!, $chainId: Int!) {
  markets(where: {chainId_in: [$chainId], collateralAssetAddress_in: [$asset]}) {
    items {
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
        supplyAssets
        borrowAssets
      }
      warnings {
        type
        level
      }
    }
  }
}
    `;

/**
 * __useGetAssetMarketsQuery__
 *
 * To run a query within a React component, call `useGetAssetMarketsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAssetMarketsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAssetMarketsQuery({
 *   variables: {
 *      asset: // value for 'asset'
 *      chainId: // value for 'chainId'
 *   },
 * });
 */
export function useGetAssetMarketsQuery(
	baseOptions: Apollo.QueryHookOptions<
		GetAssetMarketsQuery,
		GetAssetMarketsQueryVariables
	> &
		(
			| { variables: GetAssetMarketsQueryVariables; skip?: boolean }
			| { skip: boolean }
		),
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useQuery<GetAssetMarketsQuery, GetAssetMarketsQueryVariables>(
		GetAssetMarketsDocument,
		options,
	);
}
export function useGetAssetMarketsLazyQuery(
	baseOptions?: Apollo.LazyQueryHookOptions<
		GetAssetMarketsQuery,
		GetAssetMarketsQueryVariables
	>,
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useLazyQuery<
		GetAssetMarketsQuery,
		GetAssetMarketsQueryVariables
	>(GetAssetMarketsDocument, options);
}
export function useGetAssetMarketsSuspenseQuery(
	baseOptions?: Apollo.SuspenseQueryHookOptions<
		GetAssetMarketsQuery,
		GetAssetMarketsQueryVariables
	>,
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useSuspenseQuery<
		GetAssetMarketsQuery,
		GetAssetMarketsQueryVariables
	>(GetAssetMarketsDocument, options);
}
export type GetAssetMarketsQueryHookResult = ReturnType<
	typeof useGetAssetMarketsQuery
>;
export type GetAssetMarketsLazyQueryHookResult = ReturnType<
	typeof useGetAssetMarketsLazyQuery
>;
export type GetAssetMarketsSuspenseQueryHookResult = ReturnType<
	typeof useGetAssetMarketsSuspenseQuery
>;
export type GetAssetMarketsQueryResult = Apollo.QueryResult<
	GetAssetMarketsQuery,
	GetAssetMarketsQueryVariables
>;
