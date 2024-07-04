import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import { parseUnits } from "viem";
import type { Position } from "../app/positions/[user]/[market]/page";
import "evm-maths";
import MarketIcon from "./MarketIcon";

export interface Market extends Pick<Position["market"], "uniqueKey" | "lltv"> {
	collateralAsset: Pick<
		NonNullable<Position["market"]["collateralAsset"]>,
		"symbol"
	> | null;
	loanAsset: Pick<Position["market"]["loanAsset"], "symbol">;
}

const MarketTitle = ({
	market,
	noLink = false,
}: { market: Market; noLink?: boolean }) => {
	const maxLeverage = React.useMemo(
		() =>
			BigInt.WAD.wadDiv(BigInt.WAD - market.lltv).wadMulDown(
				parseUnits("0.998", 18),
			),
		[market.lltv],
	);

	return (
		<Stack
			direction="row"
			justifyContent="space-between"
			alignItems="center"
			padding={2}
		>
			<Stack direction="row" alignItems="center">
				<MarketIcon market={market} sx={{ marginRight: 1 }} />
				<Typography variant="h5">
					{market.collateralAsset?.symbol ?? "Unknown"} /{" "}
					{market.loanAsset.symbol}
				</Typography>
				{!noLink && (
					<IconButton
						component="a"
						href={`https://app.morpho.org/market?id=${market.uniqueKey}`}
						target="_blank"
						rel="noreferrer noopener"
						size="small"
						sx={{ marginLeft: 1 }}
					>
						<OpenInNewIcon fontSize="small" />
					</IconButton>
				)}
			</Stack>
			<Chip
				size="small"
				label={
					<Typography variant="caption">
						× {maxLeverage.format(18, 2)}
					</Typography>
				}
			/>
		</Stack>
	);
};

export default React.memo(MarketTitle);
