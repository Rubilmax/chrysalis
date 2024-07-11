import "evm-maths";

import React from "react";
import { parseUnits } from "viem";
import { parseNumber } from "./format";
import type { Asset, MarketState } from "./graphql/types";
import { useAssetYields } from "./yield";

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

export const usePositionDetails = ({
	balance,
	withdraw = 0n,
	market: { collateralPrice, ...market },
	leverage,
}: {
	leverage: number;
	balance: bigint;
	withdraw?: bigint;
	market: {
		collateralAsset: Pick<Asset, "address">;
		state: Pick<MarketState, "borrowApy"> | null;
		collateralPrice: bigint;
	};
}) => {
	const [collateralYields] = useAssetYields(market.collateralAsset.address);

	const targetLtv = React.useMemo(
		() => BigInt.WAD - BigInt.WAD.wadDivUp(parseNumber(leverage)),
		[leverage],
	);

	const targetCollateral = React.useMemo(() => {
		if (withdraw == null) return;
		if (targetLtv === 0n) return balance - withdraw;

		return (balance - withdraw).wadDivDown(BigInt.WAD - targetLtv);
	}, [balance, withdraw, targetLtv]);
	const targetLoan = React.useMemo(() => {
		if (targetCollateral == null) return;
		if (targetCollateral === 0n) return 0n;

		return targetLtv.wadMulDown(
			targetCollateral.mulDivDown(collateralPrice, parseUnits("1", 36)),
		);
	}, [collateralPrice, targetCollateral, targetLtv]);

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

	const targetPositionApy = usePositionApy(
		targetCollateralValue,
		targetLoan,
		collateralYields?.apy,
		market.state?.borrowApy, // TODO: use targetBorrowApy
	);

	return {
		collateralYields,
		targetLtv,
		targetCollateral,
		targetLoan,
		resultLtv,
		targetBalance,
		targetPositionApy,
	};
};
