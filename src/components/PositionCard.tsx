import type { GetUserMarketPositionQuery } from "@/graphql/GetMarketPosition.query.generated";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import MarketTitle from "./MarketTitle";
import PositionContent from "./PositionContent";

export type Position = GetUserMarketPositionQuery["marketPosition"];

const PositionCard = ({ position }: { position: Position }) => {
	return (
		<Paper>
			<MarketTitle market={position.market} />
			<Divider />
			{position.market.collateralAsset &&
			position.market.collateralPrice != null ? (
				<PositionContent
					// @ts-ignore
					position={position}
				/>
			) : (
				<Stack padding={2}>
					<Typography variant="caption" color="error">
						Unknown collateral
					</Typography>
				</Stack>
			)}
		</Paper>
	);
};

export default React.memo(PositionCard);
