import type { Address } from "viem";

export interface QuoteParams {
	chainId: number;
	sellToken: Address;
	buyToken: Address;
	sellAmount: bigint;
	buyAmount?: bigint;
	slippagePercentage?: number;
	takerAddress?: Address;
	skipValidation?: boolean;
	feeRecipient?: Address;
	buyTokenPercentageFee?: number;
	priceImpactProtectionPercentage?: number;
	feeRecipientTradeSurplus?: Address;
	shouldSellEntireBalance?: boolean;
}

export interface QuoteResponse {
	chainId: number;
	price: string;
	guaranteedPrice: string;
	estimatedPriceImpact: string;
	to: string;
	from: string;
	data: Address;
	value: string;
	gas: string;
	estimatedGas: string;
	gasPrice: string;
	grossBuyAmount: string;
	protocolFee: string;
	minimumProtocolFee: string;
	buyTokenAddress: string;
	sellTokenAddress: string;
	buyAmount: string;
	sellAmount: string;
	allowanceTarget: string;
	decodedUniqueId: string;
	sellTokenToEthRate: string;
	buyTokenToEthRate: string;
	expectedSlippage: string | null;
}

export const ZERO_X_API_BASE_URL: Record<number, string> = {
	1: "https://api.0x.org",
	8453: "https://base.api.0x.org",
};

/**
 * @param srcTokenAddress The token to swap from (native token: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE).
 * @param dst The token to swap to (native token: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE).
 * @param amount The amount of input tokens to swap.
 * @param fromAddress The address that calls the 1inch contract.
 * @param slippage The maximum slippage to accept, as a percentage (min: 0, max: 50).
 * @returns
 */
export const fetchQuote = async (
	{ chainId, ...options }: QuoteParams,
	apiKey = process.env.ZERO_X_SWAP_API_KEY,
) => {
	if (!apiKey) throw Error("undefined api key");

	const url = new URL("/swap/v1/quote", ZERO_X_API_BASE_URL[chainId]);

	for (const [key, value] of Object.entries(options)) {
		url.searchParams.set(key, value.toString());
	}

	const res = await fetch(url, {
		headers: {
			accept: "application/json",
			"0x-api-key": apiKey,
		},
	});

	if (!res.ok) throw Error(res.statusText);

	return res.json() as Promise<QuoteResponse>;
};
