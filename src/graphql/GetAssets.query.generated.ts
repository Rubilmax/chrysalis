import type * as Types from "./types";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetAssetsQueryVariables = Types.Exact<{
	chainId: Types.Scalars["Int"]["input"];
}>;

export type GetAssetsQuery = {
	__typename?: "Query";
	assets: {
		__typename?: "PaginatedAssets";
		items: Array<{
			__typename?: "Asset";
			id: string;
			address: Types.Scalars["Address"]["output"];
			symbol: string;
			name: string;
			decimals: number;
			priceUsd: number | null;
		}> | null;
	};
};

export const GetAssetsDocument = gql`
    query getAssets($chainId: Int!) {
  assets(where: {chainId_in: [$chainId]}) {
    items {
      id
      address
      symbol
      name
      decimals
      priceUsd
    }
  }
}
    `;

/**
 * __useGetAssetsQuery__
 *
 * To run a query within a React component, call `useGetAssetsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAssetsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAssetsQuery({
 *   variables: {
 *      chainId: // value for 'chainId'
 *   },
 * });
 */
export function useGetAssetsQuery(
	baseOptions: Apollo.QueryHookOptions<
		GetAssetsQuery,
		GetAssetsQueryVariables
	> &
		(
			| { variables: GetAssetsQueryVariables; skip?: boolean }
			| { skip: boolean }
		),
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useQuery<GetAssetsQuery, GetAssetsQueryVariables>(
		GetAssetsDocument,
		options,
	);
}
export function useGetAssetsLazyQuery(
	baseOptions?: Apollo.LazyQueryHookOptions<
		GetAssetsQuery,
		GetAssetsQueryVariables
	>,
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useLazyQuery<GetAssetsQuery, GetAssetsQueryVariables>(
		GetAssetsDocument,
		options,
	);
}
export function useGetAssetsSuspenseQuery(
	baseOptions?: Apollo.SuspenseQueryHookOptions<
		GetAssetsQuery,
		GetAssetsQueryVariables
	>,
) {
	const options = { ...defaultOptions, ...baseOptions };
	return Apollo.useSuspenseQuery<GetAssetsQuery, GetAssetsQueryVariables>(
		GetAssetsDocument,
		options,
	);
}
export type GetAssetsQueryHookResult = ReturnType<typeof useGetAssetsQuery>;
export type GetAssetsLazyQueryHookResult = ReturnType<
	typeof useGetAssetsLazyQuery
>;
export type GetAssetsSuspenseQueryHookResult = ReturnType<
	typeof useGetAssetsSuspenseQuery
>;
export type GetAssetsQueryResult = Apollo.QueryResult<
	GetAssetsQuery,
	GetAssetsQueryVariables
>;
