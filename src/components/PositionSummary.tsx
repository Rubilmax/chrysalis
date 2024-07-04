import { type AssetYields, usePositionApy } from "@/yield";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React from "react";
import { parseUnits } from "viem";
import type { Position } from "../app/positions/[user]/[market]/page";
import AccruingQuantity from "./AccruingQuantity";
import Token from "./Token";

const PositionSummary = ({
	position: {
		collateral,
		borrowAssets,
		market: { loanAsset, collateralAsset, collateralPrice, ...market },
	},
	positionApy,
	collateralYields,
}: {
	position: Omit<Position, "market"> & {
		market: Omit<Position["market"], "collateralAsset" | "collateralPrice"> & {
			collateralAsset: NonNullable<Position["market"]["collateralAsset"]>;
			collateralPrice: NonNullable<Position["market"]["collateralPrice"]>;
		};
	};
	positionApy?: number;
	collateralYields?: AssetYields;
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
		collateralYields?.dailyApy,
		market.dailyApys?.borrowApy,
	);
	const weeklyPositionApy = usePositionApy(
		collateralValue,
		borrowAssets,
		collateralYields?.weeklyApy,
		market.weeklyApys?.borrowApy,
	);
	const monthlyPositionApy = usePositionApy(
		collateralValue,
		borrowAssets,
		collateralYields?.monthlyApy,
		market.monthlyApys?.borrowApy,
	);

	return (
		<Stack direction="row" justifyContent="space-between" alignItems="center">
			<Stack flex={1} padding={2}>
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
				>
					<Typography variant="h6">
						{!collateralYields?.underlying && "$ "}
						<AccruingQuantity
							quantity={balance.toFloat(collateralAsset.decimals)}
							ratePerSecond={positionApy ?? 0}
							precision={Math.min(collateralAsset.decimals, 3)}
							decimals={Math.min(collateralAsset.decimals, 9)}
						/>
					</Typography>
					{collateralYields?.underlying?.symbol && (
						<Token symbol={collateralYields.underlying.symbol} size={20} />
					)}
				</Stack>
				<Stack direction="row" alignItems="center">
					<Typography variant="body1" mr={2}>
						{balance.format(collateralAsset.decimals, 3)}
					</Typography>
					<Token symbol={collateralAsset.symbol} size={20} />
				</Stack>
			</Stack>
			<Stack padding={2}>
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
									{monthlyPositionApy
										? (monthlyPositionApy * 100).toFixed(2)
										: 0}
									%
								</Typography>
								<Typography variant="body2">
									{weeklyPositionApy ? (weeklyPositionApy * 100).toFixed(2) : 0}
									%
								</Typography>
								<Typography variant="body2">
									{dailyPositionApy ? (dailyPositionApy * 100).toFixed(2) : 0}%
								</Typography>
							</Stack>
						</Stack>
					}
				>
					<Typography variant="h6">
						{positionApy ? (positionApy * 100).toFixed(2) : 0}%
					</Typography>
				</Tooltip>
			</Stack>
		</Stack>
	);
};

export default React.memo(PositionSummary);
