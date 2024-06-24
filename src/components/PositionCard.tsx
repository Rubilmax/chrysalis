import type { GetUserMarketPositionsQuery } from "@/graphql/GetMarketPositions.query.generated";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import PositionContent from "./PositionContent";

export type Position =
	GetUserMarketPositionsQuery["userByAddress"]["marketPositions"][number];

const PositionCard = ({ position }: { position: Position }) => {
	return (
		<Paper key={position.market.uniqueKey}>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				padding={2}
			>
				<Stack>
					<Stack direction="row" alignItems="center" mb={1}>
						<AvatarGroup sx={{ marginRight: 1 }}>
							{position.market.collateralAsset && (
								<Avatar
									src={`https://cdn.morpho.org/assets/logos/${position.market.collateralAsset.symbol.toLowerCase()}.svg`}
									sx={{ width: 32, height: 32, marginRight: -1 }}
								/>
							)}
							<Avatar
								src={`https://cdn.morpho.org/assets/logos/${position.market.loanAsset.symbol.toLowerCase()}.svg`}
								sx={{ width: 32, height: 32 }}
							/>
						</AvatarGroup>
						<Typography variant="h5" fontWeight={500}>
							{position.market.collateralAsset?.symbol ?? "Unknown"} /{" "}
							{position.market.loanAsset.symbol}
						</Typography>
						<IconButton
							component="a"
							href={`https://app.morpho.org/market?id=${position.market.id}`}
							target="_blank"
							rel="noreferrer noopener"
							size="small"
							sx={{ marginLeft: 1 }}
						>
							<OpenInNewIcon fontSize="small" />
						</IconButton>
					</Stack>
					<Stack direction="row">
						<Chip
							size="small"
							label={
								<Typography variant="caption">
									{position.market.lltv.format(16, 1)}%
								</Typography>
							}
						/>
					</Stack>
				</Stack>
			</Stack>
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
