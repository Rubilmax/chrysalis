"use client";

import React, { memo, useMemo } from "react";
import { parseUnits } from "viem";
import "evm-maths";
import { GetUserMarketPositionsQuery } from "@/graphql/GetMarketPositions.query.generated";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

const Position = ({
	position,
}: {
	position: GetUserMarketPositionsQuery["userByAddress"]["marketPositions"][number];
}) => {
	const collateralValue = useMemo(() => {
		if (position.market.collateralPrice == null) return null;

		return position.collateral.mulDivDown(
			position.market.collateralPrice,
			parseUnits("1", 36),
		);
	}, [position]);

	const ltv = useMemo(() => {
		if (collateralValue == null) return "∞";

		return position.borrowAssets.wadDiv(collateralValue).format(16, 3);
	}, [position]);

	const leverage = useMemo(() => {
		if (collateralValue == null) return "∞";

		return collateralValue
			.wadDiv(collateralValue - position.borrowAssets)
			.formatWad(2);
	}, [position]);

	const borrowApy = position.market.dailyApys?.borrowApy;

	return (
		<Paper key={position.market.uniqueKey}>
			<Box padding={2} display="flex" alignItems="center">
				<Box display="flex" flexDirection="column">
					{/* <Avatar src={position.market.collateralAsset} /> */}
					<Typography variant="h4">
						{position.market.collateralAsset?.symbol ?? "[IDLE]"} /{" "}
						{position.market.loanAsset.symbol}
					</Typography>
					<Box display="flex">
						<Chip
							size="small"
							label={`${position.market.lltv.format(16, 1)}%`}
						/>
					</Box>
				</Box>
				<Box marginLeft={3}>
					<Typography variant="h5">
						{borrowApy ? (borrowApy * 100).toFixed(2) : 0}%
					</Typography>
				</Box>
			</Box>
			<Divider />
			<Box padding={2} display="flex" flexDirection="column">
				<Typography>
					Collateral:{" "}
					{position.collateral.format(
						position.market.collateralAsset?.decimals,
						3,
					)}{" "}
					($
					{position.collateralUsd?.toFixed(2)})
				</Typography>
				<Typography>
					Borrow:{" "}
					{position.borrowAssets.format(position.market.loanAsset.decimals, 3)}{" "}
					($
					{position.borrowAssetsUsd?.toFixed(2)})
				</Typography>
				<Typography>LTV: {ltv}%</Typography>
				<Typography>Leverage: {leverage}</Typography>
				<Box display="flex" justifyItems="right">
					<Button variant="contained" disableElevation>
						Close position
					</Button>
				</Box>
			</Box>
		</Paper>
	);
};

export default memo(Position);
