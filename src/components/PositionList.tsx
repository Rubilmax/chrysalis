import {
	type GetUserMarketPositionSummariesQuery,
	useGetUserMarketPositionSummariesQuery,
} from "@/graphql/GetMarketPositionSummaries.query.generated";
import { useAssetYields, usePositionApy } from "@/yield";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import { type Address, parseUnits } from "viem";
import { useChainId } from "wagmi";
import MarketIcon from "./MarketIcon";

type QueryPosition =
	GetUserMarketPositionSummariesQuery["userByAddress"]["marketPositions"][number];

interface Position extends QueryPosition {
	market: Omit<
		QueryPosition["market"],
		"collateralAsset" | "collateralPrice"
	> & {
		collateralAsset: NonNullable<QueryPosition["market"]["collateralAsset"]>;
		collateralPrice: NonNullable<QueryPosition["market"]["collateralPrice"]>;
	};
}

const PositionItem = React.memo(
	({
		position: {
			collateral,
			borrowAssets,
			user,
			market: { collateralPrice, ...market },
		},
	}: {
		position: Position;
	}) => {
		const [collateralYields, isFetching] = useAssetYields(
			market.collateralAsset.address,
		);

		const collateralValue = React.useMemo(
			() => collateral.mulDivDown(collateralPrice, parseUnits("1", 36)),
			[collateral, collateralPrice],
		);

		const usdBalance = React.useMemo(
			() =>
				(collateralValue - borrowAssets).wadDiv(
					parseUnits((market.loanAsset.priceUsd ?? 0).toFixed(18), 18),
				),
			[collateralValue, borrowAssets, market.loanAsset.priceUsd],
		);

		const positionApy = usePositionApy(
			collateralValue,
			borrowAssets,
			collateralYields?.apy,
			market.state?.borrowApy,
		);

		return (
			<ListItem
				secondaryAction={
					<Stack alignItems="flex-end">
						<Typography variant="subtitle1">
							${usdBalance.formatWad(2)}
						</Typography>
						{isFetching || positionApy == null ? (
							<Skeleton height={40} width={60} />
						) : (
							<Typography variant="subtitle2" color="text.secondary">
								{(positionApy * 100).toFixed(2)} %
							</Typography>
						)}
					</Stack>
				}
				disablePadding
			>
				<ListItemButton
					component={Link}
					href={`/positions/${user.address}/${market.uniqueKey}`}
				>
					<ListItemIcon>
						<MarketIcon market={market} />
					</ListItemIcon>
					<ListItemText
						primary={`${market.collateralAsset?.symbol ?? "Unknown"} / 
					${market.loanAsset.symbol}`}
						primaryTypographyProps={{ variant: "h6", padding: 1 }}
					/>
				</ListItemButton>
			</ListItem>
		);
	},
);

const PositionList = ({ user }: { user: Address }) => {
	const chainId = useChainId();

	const { data, loading, error } = useGetUserMarketPositionSummariesQuery({
		variables: { user, chainId },
	});

	return (
		<List subheader={<ListSubheader>Positions</ListSubheader>}>
			{loading
				? new Array(3)
						.fill(null)
						.map((_, i) => i)
						.map((i) => (
							<ListItem key={i} disablePadding>
								<Skeleton height={200} />
							</ListItem>
						))
				: data?.userByAddress.marketPositions
						.filter(
							(position) =>
								position.market.collateralAsset &&
								position.market.collateralPrice != null,
						)
						.map((position) => (
							<PositionItem
								key={user + position.market.uniqueKey}
								position={position as Position}
							/>
						))}
		</List>
	);
};

export default React.memo(PositionList);
