import Avatar from "@mui/material/Avatar";
import AvatarGroup, { type AvatarGroupProps } from "@mui/material/AvatarGroup";
import React from "react";
import type { Position } from "../app/positions/[user]/[market]/page";

export interface Market {
	collateralAsset: Pick<
		NonNullable<Position["market"]["collateralAsset"]>,
		"symbol"
	> | null;
	loanAsset: Pick<Position["market"]["loanAsset"], "symbol">;
}

export interface MarketIconProps extends AvatarGroupProps {
	market: Market;
}

const MarketIcon = ({ market, ...props }: MarketIconProps) => {
	return (
		<AvatarGroup {...props}>
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
	);
};

export default React.memo(MarketIcon);
