import "evm-maths";

import { MarketConfig } from "@morpho-org/blue-sdk";
import { blueAbi } from "@morpho-org/blue-sdk-viem";
import { ExecutorEncoder } from "executooor";
import React from "react";
import { type Hex, encodeFunctionData, maxUint256, parseUnits } from "viem";
import { useAccount, useClient } from "wagmi";
import { readContract } from "wagmi/actions";
import { ExecutorContext } from "./app/providers/ExecutorContext";
import { useEthersProvider } from "./ethers";
import { parseNumber } from "./format";
import type { Asset, Market, MorphoBlue } from "./graphql/types";
import { type BestSwapParams, fetchBestSwap } from "./swap";
import { config } from "./wagmi";

export const quoteAssets = ["collateral", "underlying"] as const;

export const getNextQuoteAsset = (quoteAsset: (typeof quoteAssets)[number]) =>
	quoteAssets[(quoteAssets.indexOf(quoteAsset) + 1) % quoteAssets.length]!;

export const usePositionApy = (
	collateralValue: bigint | undefined,
	borrowValue: bigint | undefined,
	collateralApy: number | undefined,
	borrowApy: number | null | undefined,
) =>
	React.useMemo(() => {
		if (
			collateralValue == null ||
			borrowValue == null ||
			collateralApy == null ||
			borrowApy == null
		)
			return;

		if (collateralValue === borrowValue) {
			if (borrowValue === 0n) return 0;

			return Number.POSITIVE_INFINITY;
		}

		return (
			collateralValue.wadMul(parseNumber(collateralApy)) -
			borrowValue.wadMul(parseNumber(borrowApy))
		)
			.wadDiv(collateralValue - borrowValue)
			.toWadFloat();
	}, [collateralValue, borrowValue, collateralApy, borrowApy]);

export const useTargetLtv = (leverage: number) =>
	React.useMemo(
		() => BigInt.WAD - BigInt.WAD.wadDivUp(parseNumber(leverage)),
		[leverage],
	);

export const useTargetCollateral = (
	targetLtv: bigint,
	balance: bigint,
	withdraw?: bigint,
) =>
	React.useMemo(() => {
		if (withdraw == null) return;
		if (targetLtv === 0n) return balance - withdraw;

		return (balance - withdraw).wadDivDown(BigInt.WAD - targetLtv);
	}, [balance, withdraw, targetLtv]);

export const useTargetLoan = (
	{ collateralPrice }: { collateralPrice: bigint },
	targetLtv: bigint,
	targetCollateral?: bigint,
) =>
	React.useMemo(() => {
		if (targetCollateral == null) return;
		if (targetCollateral === 0n) return 0n;

		return targetLtv.wadMulDown(
			targetCollateral.mulDivDown(collateralPrice, parseUnits("1", 36)),
		);
	}, [collateralPrice, targetCollateral, targetLtv]);

export const usePositionDetails = ({
	balance,
	withdraw = 0n,
	market,
	leverage,
}: {
	leverage: number;
	balance: bigint;
	withdraw?: bigint;
	market: {
		collateralAsset: Pick<Asset, "address">;
		collateralPrice: bigint;
	};
}) => {
	const targetLtv = useTargetLtv(leverage);

	const targetCollateral = useTargetCollateral(targetLtv, balance, withdraw);
	const targetLoan = useTargetLoan(market, targetLtv, targetCollateral);

	const { collateralPrice } = market;
	const targetCollateralValue = React.useMemo(
		() => targetCollateral?.mulDivDown(collateralPrice, parseUnits("1", 36)),
		[targetCollateral, collateralPrice],
	);

	const resultLtv = React.useMemo(() => {
		if (targetCollateralValue == null || targetLoan == null) return;
		if (targetCollateralValue === 0n) return 0n;

		return targetLoan.wadDiv(targetCollateralValue);
	}, [targetLoan, targetCollateralValue]);

	const targetBalance = React.useMemo(() => {
		if (targetCollateralValue == null || targetLoan == null) return;

		return (targetCollateralValue - targetLoan).mulDivDown(
			parseUnits("1", 36),
			collateralPrice,
		);
	}, [targetLoan, collateralPrice, targetCollateralValue]);

	return {
		targetLtv,
		targetCollateral,
		targetLoan,
		resultLtv,
		targetBalance,
		targetCollateralValue,
	};
};

export const useGetPositionTx = (
	market?: Pick<Market, "irmAddress" | "oracleAddress" | "lltv"> & {
		loanAsset: Pick<Asset, "address">;
		collateralAsset: Pick<Asset, "address">;
		collateralPrice: bigint;
		morphoBlue: Pick<MorphoBlue, "address">;
	},
) => {
	const account = useAccount();
	const provider = useEthersProvider();
	const { executor } = React.useContext(ExecutorContext);

	return async (
		suppliedCollateral: bigint,
		borrowedAssets: bigint,
		repaidShares?: bigint,
	) => {
		if (!market) throw Error("unknown market");
		if (!account.address || account.chainId == null)
			throw Error("invalid account");
		if (!executor) throw Error("unknown executor");

		const marketParams = new MarketConfig({
			collateralToken: market.collateralAsset.address,
			loanToken: market.loanAsset.address,
			irm: market.irmAddress,
			oracle: market.oracleAddress,
			lltv: market.lltv,
		});

		const encoder = new ExecutorEncoder(executor.address, provider);

		if (suppliedCollateral < 0n)
			encoder.morphoBlueWithdrawCollateral(
				market.morphoBlue.address,
				marketParams,
				-suppliedCollateral,
				account.address,
				executor.address,
			);

		if (borrowedAssets > 0n)
			encoder.morphoBlueBorrow(
				market.morphoBlue.address,
				marketParams,
				borrowedAssets,
				0n,
				account.address,
				executor.address,
			);

		const deleverage = borrowedAssets < 0n && suppliedCollateral < 0n;
		const leverage = borrowedAssets > 0n && suppliedCollateral > 0n;

		let params: BestSwapParams | undefined;
		if (deleverage) {
			// Repaying & withdrawing collateral: swap collateral for debt.
			params = {
				chainId: account.chainId,
				src: market.collateralAsset.address,
				dst: market.loanAsset.address,
				from: executor.address,
				amount: (-borrowedAssets)
					.mulDivUp(parseUnits("1", 36), market.collateralPrice)
					.wadMulUp(1_015000000000000000n),
				slippage: 0.0025,
			};
		} else if (leverage) {
			// Borrowing & supplying collateral: swap debt for collateral.
			params = {
				chainId: account.chainId,
				src: market.loanAsset.address,
				dst: market.collateralAsset.address,
				from: executor.address,
				amount: borrowedAssets,
				slippage: 0.0025,
			};
		}

		if (params != null) {
			const swap = await fetchBestSwap(params);

			if (swap.spender)
				// TODO: check if allowance sufficient.
				encoder.erc20Approve(params.src, swap.spender, params.amount);

			encoder.pushCall(swap.tx.to, swap.tx.value, swap.tx.data);
		}

		if (suppliedCollateral > 0n) {
			// TODO: check if allowance sufficient.
			encoder.erc20Approve(
				market.collateralAsset.address,
				market.morphoBlue.address,
				suppliedCollateral,
			);

			encoder.morphoBlueSupplyCollateral(
				market.morphoBlue.address,
				marketParams,
				suppliedCollateral,
				account.address,
				encoder.flush(),
			);
		}

		if (borrowedAssets < 0n) {
			const repaidAssets = -borrowedAssets;

			if (repaidShares) {
				// TODO: check if allowance sufficient.
				encoder.erc20Approve(
					market.loanAsset.address,
					market.morphoBlue.address,
					repaidAssets.wadMul(1_001000000000000000n),
				);

				encoder.morphoBlueRepay(
					market.morphoBlue.address,
					marketParams,
					0n,
					repaidShares,
					account.address,
					encoder.flush(),
				);
			} else {
				// TODO: check if allowance sufficient.
				encoder.erc20Approve(
					market.loanAsset.address,
					market.morphoBlue.address,
					repaidAssets,
				);

				encoder.morphoBlueRepay(
					market.morphoBlue.address,
					marketParams,
					repaidAssets,
					0n,
					account.address,
					encoder.flush(),
				);
			}
		}

		if (deleverage && -suppliedCollateral > (params!.amount ?? 0n)) {
			const remainingCollateral = -suppliedCollateral - params!.amount;

			// const swap = await fetchBestSwap({
			// 	chainId: account.chainId,
			// 	src: collateralAsset.address,
			// 	dst: loanAsset.address,
			// 	from: executor.address,
			// 	amount: remainingCollateral,
			// 	slippage: 0.0025,
			// });

			// if (swap.spender)
			// 	// TODO: check if allowance sufficient.
			// 	encoder.erc20Approve(
			// 		collateralAsset.address,
			// 		swap.spender,
			// 		remainingCollateral,
			// 	);

			// encoder.pushCall(swap.tx.to, swap.tx.value, swap.tx.data);

			encoder.erc20Transfer(
				market.collateralAsset.address,
				account.address,
				remainingCollateral,
			);
		}

		return {
			to: executor.address,
			data: encodeFunctionData({
				abi: [
					{
						inputs: [
							{
								internalType: "bytes[]",
								name: "data",
								type: "bytes[]",
							},
						],
						name: "exec_606BaXt",
						outputs: [],
						stateMutability: "payable",
						type: "function",
					},
				],
				functionName: "exec_606BaXt",
				args: [encoder.flush() as Hex[]],
			}),
			value: 0n,
			gas: 500_000n, // TODO: add transport to simulate gas
		};
	};
};
