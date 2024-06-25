import type { Address } from "viem";

export interface SwapParams {
	chainId: bigint | number;
	src: Address;
	dst: Address;
	amount: bigint;
	from: Address;
	slippage: bigint;
	protocols?: string;
	fee?: bigint;
	gasPrice?: bigint;
	complexityLevel?: number;
	parts?: number;
	mainRouteParts?: number;
	gasLimit?: bigint;
	includeTokensInfo?: boolean;
	includeProtocols?: boolean;
	includeGas?: boolean;
	connectorTokens?: string;
	excludedProtocols?: string;
	permit?: string;
	receiver?: string;
	referrer?: string;
	allowPartialFill?: boolean;
	disableEstimate?: boolean;
	usePermit2?: boolean;
}

export interface SwapToken {
	symbol: string;
	name: string;
	decimals: number;
	address: string;
	logoURI: string;
}

export interface SwapResponse {
	srcToken: SwapToken;
	dstToken: SwapToken;
	dstAmount: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	protocols: Array<any>;
	tx: {
		from: string;
		to: string;
		data: string;
		value: string;
		gasPrice: string;
		gas: number;
	};
}

export const ONE_INCH_API_BASE_URL = "https://api.1inch.dev";

export const getOneInchSwapApiPath = (chainId: bigint | number) =>
	`/swap/v6.0/${chainId}/swap`;
export const getOneInchSwapApiUrl = (chainId: bigint | number) =>
	new URL(getOneInchSwapApiPath(chainId), ONE_INCH_API_BASE_URL).toString();

/**
 * @param srcTokenAddress The token to swap from (native token: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE).
 * @param dst The token to swap to (native token: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE).
 * @param amount The amount of input tokens to swap.
 * @param fromAddress The address that calls the 1inch contract.
 * @param slippage The maximum slippage to accept, as a percentage (min: 0, max: 50).
 * @returns
 */
export const fetchSwap = async (
	{ chainId, slippage, ...options }: SwapParams,
	apiKey = process.env.NEXT_PUBLIC_ONE_INCH_SWAP_API_KEY,
) => {
	const url = new URL(getOneInchSwapApiPath(chainId), ONE_INCH_API_BASE_URL);

	url.searchParams.set("slippage", slippage.format(16, 2));

	for (const [key, value] of Object.entries(options)) {
		url.searchParams.set(key, value.toString());
	}

	const res = await fetch(url, {
		headers: {
			accept: "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
	});

	if (!res.ok) throw Error(res.statusText);

	return res.json() as Promise<SwapResponse>;
};
