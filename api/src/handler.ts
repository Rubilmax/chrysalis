import type { APIGatewayProxyHandler } from "aws-lambda";
import { type Address, isAddress, zeroAddress } from "viem";
import { fetchQuote } from "./0x";
import { fetchSwap } from "./1inch";

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

// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
const isDefined = <T>(value: T | null | undefined | void): value is T =>
	value != null;

export const swap: APIGatewayProxyHandler = async (
	{ queryStringParameters },
	context,
) => {
	try {
		const chainId = Number.parseInt(queryStringParameters?.chainId ?? "");
		const slippage = Number.parseFloat(queryStringParameters?.slippage ?? "");
		const amount = BigInt(queryStringParameters?.amount ?? "");
		const { src, dst, from } = queryStringParameters ?? {};

		if (
			queryStringParameters == null ||
			Number.isNaN(chainId) ||
			!src ||
			!isAddress(src) ||
			!dst ||
			!isAddress(dst) ||
			!from ||
			!isAddress(from) ||
			!amount ||
			!slippage
		)
			throw Error("invalid query");

		const quotes = await Promise.all([
			fetchSwap({
				chainId,
				src,
				dst,
				from,
				amount,
				slippage: slippage * 100,
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
				sellToken: src,
				buyToken: dst,
				sellAmount: amount,
				takerAddress: from,
				slippagePercentage: slippage,
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
		const firstSuccessQuote = successQuotes[0];
		if (firstSuccessQuote == null) throw Error("no successful quote");

		return {
			statusCode: 200,
			body: JSON.stringify(
				successQuotes.reduce(
					(prev, current) =>
						prev && prev.amountOut > current.amountOut ? prev : current,
					firstSuccessQuote,
				).res,
			),
		};
	} catch (error) {
		if (error instanceof Error) return { statusCode: 400, body: error.message };

		throw error;
	}
};
