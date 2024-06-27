import type { Address } from "viem";

export interface SwapParams {
	chainId: bigint | number;
	src: Address;
	dst: Address;
	amount: bigint;
	from: Address;
	slippage: number;
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
	receiver?: Address;
	referrer?: Address;
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

/**
 * @param srcTokenAddress The token to swap from (native token: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE).
 * @param dst The token to swap to (native token: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE).
 * @param amount The amount of input tokens to swap.
 * @param fromAddress The address that calls the 1inch contract.
 * @param slippage The maximum slippage to accept, as a percentage (min: 0, max: 50).
 * @returns
 */
export const fetchSwap = async (
	{ chainId, ...options }: SwapParams,
	apiKey = process.env.ONE_INCH_SWAP_API_KEY,
) => {
	if (!apiKey) throw Error("undefined api key");

	const url = new URL(`/swap/v6.0/${chainId}/swap`, ONE_INCH_API_BASE_URL);

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
