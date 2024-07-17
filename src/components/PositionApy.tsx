import type { MarketApyAggregates, MarketState } from "@/graphql/types";
import { usePositionApy } from "@/position";
import type { AssetYields } from "@/yield";
import React from "react";
import Apy, { type ApyProps } from "./Apy";

export interface PositionApyProps extends ApyProps {
	market: {
		state: Pick<MarketState, "borrowApy"> | null;
		dailyApys: Pick<MarketApyAggregates, "borrowApy"> | null;
		weeklyApys: Pick<MarketApyAggregates, "borrowApy"> | null;
		monthlyApys: Pick<MarketApyAggregates, "borrowApy"> | null;
	};
	collateralValue?: bigint;
	borrowAssets?: bigint;
	quoteAsset?: "collateral" | "underlying";
	collateralYields?: AssetYields;
}

const PositionApy = ({
	market,
	collateralValue,
	borrowAssets,
	quoteAsset = "underlying",
	collateralYields,
	...props
}: PositionApyProps) => {
	const positionApy = usePositionApy(
		collateralValue,
		borrowAssets,
		quoteAsset === "collateral" ? 0 : collateralYields?.apy,
		market.state?.borrowApy,
	);
	const dailyPositionApy = usePositionApy(
		collateralValue,
		borrowAssets,
		quoteAsset === "collateral" ? 0 : collateralYields?.dailyApy,
		market.dailyApys?.borrowApy,
	);
	const weeklyPositionApy = usePositionApy(
		collateralValue,
		borrowAssets,
		quoteAsset === "collateral" ? 0 : collateralYields?.weeklyApy,
		market.weeklyApys?.borrowApy,
	);
	const monthlyPositionApy = usePositionApy(
		collateralValue,
		borrowAssets,
		quoteAsset === "collateral" ? 0 : collateralYields?.monthlyApy,
		market.monthlyApys?.borrowApy,
	);

	return (
		<Apy
			{...props}
			title="The position's net APY"
			apy={positionApy}
			dailyApy={dailyPositionApy}
			weeklyApy={weeklyPositionApy}
			monthlyApy={monthlyPositionApy}
		/>
	);
};

export default React.memo(PositionApy);
