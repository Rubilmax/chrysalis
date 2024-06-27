import { usePositionApy } from "@/yield";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React from "react";
import { parseUnits } from "viem";
import AccruingQuantity from "./AccruingQuantity";
import type { Position } from "./PositionCard";
import Token from "./Token";

const PositionSummary = ({
	position: {
		collateral,
		borrowAssets,
		market: { loanAsset, collateralAsset, collateralPrice, ...market },
	},
	positionApy,
	collateralApy,
}: {
	position: Omit<Position, "market"> & {
		market: Omit<Position["market"], "collateralAsset" | "collateralPrice"> & {
			collateralAsset: NonNullable<Position["market"]["collateralAsset"]>;
			collateralPrice: NonNullable<Position["market"]["collateralPrice"]>;
		};
	};
	positionApy?: number;
	collateralApy?: number;
}) => {
	const collateralValue = React.useMemo(
		() => collateral.mulDivDown(collateralPrice, parseUnits("1", 36)),
		[collateral, collateralPrice],
	);

	const balance = React.useMemo(
		() =>
			(collateralValue - borrowAssets).mulDivDown(
				parseUnits("1", 36),
				collateralPrice,
			),
		[borrowAssets, collateralPrice, collateralValue],
	);

	const dailyPositionApy = usePositionApy(
		collateralValue,
		borrowAssets,
		collateralApy,
		market.dailyApys?.borrowApy,
	);
	const weeklyPositionApy = usePositionApy(
		collateralValue,
		borrowAssets,
		collateralApy,
		market.weeklyApys?.borrowApy,
	);
	const monthlyPositionApy = usePositionApy(
		collateralValue,
		borrowAssets,
		collateralApy,
		market.monthlyApys?.borrowApy,
	);

	return (
		<Stack
			direction="row"
			justifyContent="space-between"
			alignItems="center"
			padding={2}
		>
			<Stack>
				<Typography variant="h6">
					<AccruingQuantity
						quantity={balance.toFloat(collateralAsset.decimals)}
						ratePerSecond={positionApy ?? 0}
						precision={Math.min(collateralAsset.decimals, 3)}
						decimals={Math.min(collateralAsset.decimals, 9)}
					/>{" "}
					<Token symbol={collateralAsset.symbol} size={20} />
				</Typography>
			</Stack>
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
								{monthlyPositionApy ? (monthlyPositionApy * 100).toFixed(2) : 0}
								%
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
				<Stack alignItems="center" ml={2}>
					<Typography variant="caption">now</Typography>
					<Typography variant="h6" mt={-1}>
						{positionApy ? (positionApy * 100).toFixed(2) : 0}%
					</Typography>
				</Stack>
			</Tooltip>
		</Stack>
	);
};

export default React.memo(PositionSummary);