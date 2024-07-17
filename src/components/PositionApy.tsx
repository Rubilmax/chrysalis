import type { MarketApyAggregates, MarketState } from "@/graphql/types";
import { usePositionApy } from "@/position";
import type { AssetYields } from "@/yield";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import React from "react";

export interface PositionApyProps extends TypographyProps {
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
		<Tooltip
			placement="top"
			title={
				<Stack direction="row" justifyContent="space-between">
					<Stack alignItems="end">
						<Typography variant="caption">30d</Typography>
						<Typography variant="caption">7d</Typography>
						<Typography variant="caption">1d</Typography>
					</Stack>
					<Stack ml={2}>
						<Typography variant="body2">
							{monthlyPositionApy ? (monthlyPositionApy * 100).toFixed(2) : 0}%
						</Typography>
						<Typography variant="body2">
							{weeklyPositionApy ? (weeklyPositionApy * 100).toFixed(2) : 0}%
						</Typography>
						<Typography variant="body2">
							{dailyPositionApy ? (dailyPositionApy * 100).toFixed(2) : 0}%
						</Typography>
					</Stack>
				</Stack>
			}
		>
			{positionApy != null ? (
				<Typography {...props}>{(positionApy * 100).toFixed(2)}%</Typography>
			) : (
				<Skeleton height={40} width={60} />
			)}
		</Tooltip>
	);
};

export default React.memo(PositionApy);
