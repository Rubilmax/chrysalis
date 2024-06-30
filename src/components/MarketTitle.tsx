import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import { parseUnits } from "viem";
import type { Position } from "./PositionCard";
import "evm-maths";

export interface Market extends Pick<Position["market"], "lltv"> {
	collateralAsset: Pick<
		NonNullable<Position["market"]["collateralAsset"]>,
		"symbol"
	> | null;
	loanAsset: Pick<Position["market"]["loanAsset"], "symbol">;
}

const MarketTitle = ({ market }: { market: Market }) => {
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
				<AvatarGroup sx={{ marginRight: 1 }}>
					{market.collateralAsset && (
						<Avatar
							src={`https://cdn.morpho.org/assets/logos/${market.collateralAsset.symbol.toLowerCase()}.svg`}
							sx={{ width: 32, height: 32, marginRight: -1 }}
						/>
					)}
					<Avatar
						src={`https://cdn.morpho.org/assets/logos/${market.loanAsset.symbol.toLowerCase()}.svg`}
						sx={{ width: 32, height: 32 }}
					/>
				</AvatarGroup>
				<Typography variant="h5" fontWeight={500}>
					{market.collateralAsset?.symbol ?? "Unknown"} /{" "}
					{market.loanAsset.symbol}
				</Typography>
				<IconButton
					component="a"
					href={`https://app.morpho.org/market?id=${market.id}`}
					target="_blank"
					rel="noreferrer noopener"
					size="small"
					sx={{ marginLeft: 1 }}
				>
					<OpenInNewIcon fontSize="small" />
				</IconButton>
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
