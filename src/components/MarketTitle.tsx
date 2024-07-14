import type { Asset, Market } from "@/graphql/types";
import { stopPropagation } from "@/utils";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import React from "react";
import { parseUnits } from "viem";

export interface MarketTitleProps extends TypographyProps {
	market: Pick<Market, "uniqueKey" | "lltv"> & {
		collateralAsset: Pick<Asset, "symbol"> | null;
		loanAsset: Pick<Asset, "symbol">;
	};
	noLink?: boolean;
}

const MarketTitle = ({
	market,
	noLink = false,
	...props
}: MarketTitleProps) => {
	const maxLeverage = React.useMemo(
		() =>
			BigInt.WAD.wadDiv(BigInt.WAD - market.lltv).wadMulDown(
				parseUnits("0.998", 18),
			),
		[market.lltv],
	);

	return (
		<Stack direction="row" alignItems="center">
			<Typography {...props}>
				{market.collateralAsset?.symbol ?? "Unknown"} /{" "}
				{market.loanAsset.symbol}
			</Typography>
			<Chip
				size="small"
				label={
					<Typography variant="caption" fontSize={11}>
						×{maxLeverage.format(18, 2)}
					</Typography>
				}
				sx={{ marginLeft: 1 }}
			/>
			{!noLink && (
				<IconButton
					component="a"
					href={`https://app.morpho.org/market?id=${market.uniqueKey}`}
					onClick={stopPropagation}
					target="_blank"
					rel="noreferrer noopener"
					size="square"
					sx={{ marginLeft: 1 }}
				>
					<OpenInNewIcon sx={{ fontSize: 16 }} />
				</IconButton>
			)}
		</Stack>
	);
};

export default React.memo(MarketTitle);
