import "evm-maths";

import { MarketConfig } from "@morpho-org/blue-sdk";
import { ORACLE_PRICE_SCALE } from "@morpho-org/blue-sdk";
import "@morpho-org/blue-sdk-viem/lib/augment/Position";
import { fetchAccrualPositionFromConfig } from "@morpho-org/blue-sdk-viem";
import { ExecutorEncoder } from "executooor";
import React from "react";
import { type Address, type Hex, encodeFunctionData, erc20Abi } from "viem";
import { readContract } from "viem/actions";
import { useAccount, useClient } from "wagmi";
import { ExecutorContext } from "./app/providers/ExecutorContext";
import { useEthersProvider } from "./ethers";
import { parseNumber } from "./format";
import type { Asset, Market, MorphoBlue } from "./graphql/types";
import { type BestSwapParams, fetchBestSwap } from "./swap";
import { config } from "./wagmi";

export const quoteAssets = ["collateral", "underlying"] as const;

export const getNextQuoteAsset = (quoteAsset: (typeof quoteAssets)[number]) =>
	quoteAssets[(quoteAssets.indexOf(quoteAsset) + 1) % quoteAssets.length]!;

export const getTargetLtv = (leverage: number) =>
	BigInt.WAD - BigInt.WAD.wadDivUp(parseNumber(leverage));

export const getCollateralValue = (
	collateral: bigint,
	collateralPrice: bigint,
) => collateral.mulDivDown(collateralPrice, ORACLE_PRICE_SCALE);

export const getBalance = (
	collateralValue: bigint,
	borrowAssets: bigint,
	collateralPrice: bigint,
) =>
	(collateralValue - borrowAssets).mulDivDown(
		ORACLE_PRICE_SCALE,
		collateralPrice,
	);

export const getTargetCollateral = (
	targetLtv: bigint,
	balance: bigint,
	withdrawn?: bigint,
) => {
	if (withdrawn == null) return;
	if (targetLtv === 0n) return balance - withdrawn;

	return (balance - withdrawn).wadDivDown(BigInt.WAD - targetLtv);
};

export const getTargetLoan = (
	collateralPrice: bigint,
	targetLtv: bigint,
	targetCollateral?: bigint,
) => {
	if (targetCollateral == null) return;
	if (targetCollateral === 0n) return 0n;

	return targetLtv.wadMulDown(
		targetCollateral.mulDivDown(collateralPrice, ORACLE_PRICE_SCALE),
	);
};

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
	React.useMemo(() => getTargetLtv(leverage), [leverage]);

export const useCollateralValue = (
	collateral: bigint,
	collateralPrice: bigint,
) =>
	React.useMemo(
		() => getCollateralValue(collateral, collateralPrice),
		[collateral, collateralPrice],
	);

export const useBalance = (
	collateralValue: bigint,
	borrowAssets: bigint,
	collateralPrice: bigint,
) =>
	React.useMemo(
		() => getBalance(collateralValue, borrowAssets, collateralPrice),
		[collateralValue, borrowAssets, collateralPrice],
	);

export const useTargetCollateral = (
	targetLtv: bigint,
	balance: bigint,
	withdrawn?: bigint,
) =>
	React.useMemo(
		() => getTargetCollateral(targetLtv, balance, withdrawn),
		[balance, withdrawn, targetLtv],
	);

export const useTargetLoan = (
	collateralPrice: bigint,
	targetLtv: bigint,
	targetCollateral?: bigint,
) =>
	React.useMemo(
		() => getTargetLoan(collateralPrice, targetLtv, targetCollateral),
		[collateralPrice, targetCollateral, targetLtv],
	);

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
	const targetLoan = useTargetLoan(
		market.collateralPrice,
		targetLtv,
		targetCollateral,
	);

	const { collateralPrice } = market;
	const targetCollateralValue = React.useMemo(
		() => targetCollateral?.mulDivDown(collateralPrice, ORACLE_PRICE_SCALE),
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
			ORACLE_PRICE_SCALE,
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
	const client = useClient({ config });

	return async (withdrawn: bigint, targetLtv: bigint) => {
		if (!client) throw Error("unknown client");
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

		const { collateral, borrowShares, borrowAssets, collateralValue } =
			await fetchAccrualPositionFromConfig(
				account.address,
				marketParams,
				client,
				{ chainId: account.chainId },
			);

		const balance = getBalance(
			collateralValue,
			borrowAssets,
			market.collateralPrice,
		);
		const targetCollateral = getTargetCollateral(targetLtv, balance, withdrawn);
		const targetLoan = getTargetLoan(
			market.collateralPrice,
			targetLtv,
			targetCollateral,
		);
		if (targetCollateral == null) throw Error("invalid target collateral");
		if (targetLoan == null) throw Error("invalid target loan");

		const suppliedCollateral = targetCollateral - collateral;
		const borrowedAssets = targetLoan - borrowAssets;

		const encoder = new ExecutorEncoder(executor.address, provider);

		const approveIfRequired = async (
			address: Address,
			spender: Address,
			amount: bigint,
		) => {
			const allowance = await readContract(client, {
				address,
				abi: erc20Abi,
				functionName: "allowance",
				args: [executor.address, spender],
			});

			const requiredApproval = amount - allowance;
			if (requiredApproval > 0n)
				encoder.erc20Approve(address, spender, requiredApproval); // TODO: handle approve-only-once tokens
		};

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

		const deleverage = borrowedAssets < 0n && withdrawn > 0n;
		const leverage = borrowedAssets > 0n && withdrawn < 0n;

		let params: BestSwapParams | undefined;
		if (deleverage) {
			// Repaying & withdrawing collateral: swap collateral for debt.
			params = {
				chainId: account.chainId,
				src: market.collateralAsset.address,
				dst: market.loanAsset.address,
				from: executor.address,
				amount: (-borrowedAssets)
					.mulDivUp(ORACLE_PRICE_SCALE, market.collateralPrice)
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
				await approveIfRequired(params.src, swap.spender, params.amount);

			encoder.pushCall(swap.tx.to, swap.tx.value, swap.tx.data);
		}

		if (suppliedCollateral > 0n) {
			encoder.erc20TransferFrom(
				market.collateralAsset.address,
				account.address,
				executor.address,
				suppliedCollateral,
			);

			await approveIfRequired(
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

			if (targetLoan === 0n) {
				await approveIfRequired(
					market.loanAsset.address,
					market.morphoBlue.address,
					repaidAssets.wadMul(1_001000000000000000n),
				);

				encoder.morphoBlueRepay(
					market.morphoBlue.address,
					marketParams,
					0n,
					borrowShares,
					account.address,
					encoder.flush(),
				);
			} else {
				await approveIfRequired(
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

		if (deleverage && withdrawn > (params!.amount ?? 0n)) {
			const remainingCollateral = withdrawn - params!.amount;

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
