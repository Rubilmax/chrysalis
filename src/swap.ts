import type { Address } from "viem";

export interface BestSwapParams {
	chainId: number;
	src: Address;
	dst: Address;
	from: Address;
	amount: bigint;
	slippage: number;
}

export interface BestSwapResponse {
	spender?: Address;
	tx: {
		to: string;
		data: string;
		value: string;
	};
}

export const fetchBestSwap = async ({
	chainId,
	...options
}: BestSwapParams): Promise<BestSwapResponse> => {
	const url = new URL(
		"",
		"https://6jnmtecqz8.execute-api.eu-west-3.amazonaws.com",
	);

	for (const [key, value] of Object.entries(options)) {
		url.searchParams.set(key, value.toString());
	}

	const res = await fetch(url);

	return res.json();
};
