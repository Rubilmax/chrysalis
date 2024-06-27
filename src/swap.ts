import { type Address, zeroAddress } from "viem";
import { fetchQuote } from "./0x";
import { fetchSwap } from "./1inch";
import { isDefined } from "./utils";

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
}: BestSwapParams) => {
	const quotes = await Promise.all([
		fetchSwap({
			chainId,
			...options,
			slippage: options.slippage / 100,
			disableEstimate: true,
		})
			.then(({ dstAmount, tx }) => ({
				amountOut: dstAmount,
				res: {
					spender: tx.to,
					tx,
				},
			}))
			.catch(console.error),
		fetchQuote({
			chainId,
			sellToken: options.src,
			buyToken: options.dst,
			sellAmount: options.amount,
			takerAddress: options.from,
			slippagePercentage: options.slippage,
			skipValidation: true,
		})
			.then(({ buyAmount, allowanceTarget, ...tx }) => ({
				amountOut: buyAmount,
				res: {
					spender:
						allowanceTarget !== zeroAddress ? allowanceTarget : undefined,
					tx,
				},
			}))
			.catch(console.error),
	]);

	const successQuotes = quotes.filter(isDefined);
	if (successQuotes.length === 0) throw Error("no successful quote");

	return successQuotes.reduce(
		(prev, current) =>
			prev && prev.amountOut > current.amountOut ? prev : current,
		successQuotes[0]!,
	).res;
};
