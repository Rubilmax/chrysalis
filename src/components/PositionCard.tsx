import { GetUserMarketPositionsQuery } from "@/graphql/GetMarketPositions.query.generated";
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
	const borrowApy = position.market.state?.borrowApy;
	const dailyBorrowApy = position.market.dailyApys?.borrowApy;
	const weeklyBorrowApy = position.market.weeklyApys?.borrowApy;
	const monthlyBorrowApy = position.market.monthlyApys?.borrowApy;

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
				<Stack alignItems="center" ml={2}>
					<Stack direction="row" justifyContent="space-between">
						<Stack alignItems="end">
							<Typography variant="caption">30d</Typography>
							<Typography variant="caption">7d</Typography>
							<Typography variant="caption">1d</Typography>
						</Stack>
						<Stack ml={2}>
							<Typography variant="body2">
								{monthlyBorrowApy ? (monthlyBorrowApy * 100).toFixed(2) : 0}%
							</Typography>
							<Typography variant="body2">
								{weeklyBorrowApy ? (weeklyBorrowApy * 100).toFixed(2) : 0}%
							</Typography>
							<Typography variant="body2">
								{dailyBorrowApy ? (dailyBorrowApy * 100).toFixed(2) : 0}%
							</Typography>
						</Stack>
					</Stack>
					<Typography variant="caption" mt={1}>
						now
					</Typography>
					<Typography variant="h6" mt={-1}>
						{borrowApy ? (borrowApy * 100).toFixed(2) : 0}%
					</Typography>
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
