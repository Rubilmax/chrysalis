import {
	type GetUserMarketPositionSummariesQuery,
	useGetUserMarketPositionSummariesQuery,
} from "@/graphql/GetMarketPositionSummaries.query.generated";
import { usePositionApy } from "@/position";
import { useAssetYields } from "@/yield";
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
import PositionApy from "./PositionApy";

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

		return (
			<ListItem
				secondaryAction={
					<Stack alignItems="flex-end">
						<Typography variant="subtitle1">
							${usdBalance.formatWad(2)}
						</Typography>
						<PositionApy
							variant="subtitle2"
							color="text.secondary"
							market={market}
							collateralValue={collateralValue}
							borrowAssets={borrowAssets}
							collateralYields={collateralYields}
						/>
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

const isOpenPosition = <
	C extends {},
	T extends {
		borrowShares: bigint;
		market: { collateralAsset: C | null; collateralPrice: bigint | null };
	},
>(
	position: T,
): position is T & {
	market: {
		collateralAsset: C;
		collateralPrice: bigint;
	};
} =>
	position.market.collateralAsset != null &&
	position.market.collateralPrice != null &&
	position.borrowShares > 0n;

const PositionList = ({ user }: { user: Address }) => {
	const chainId = useChainId();

	const { data, loading, error } = useGetUserMarketPositionSummariesQuery({
		variables: { user, chainId },
	});

	const displayedPositions =
		data?.userByAddress.marketPositions.filter(isOpenPosition);

	return (
		<List subheader={<ListSubheader>Open positions</ListSubheader>}>
			{error ? (
				<ListItem>
					<Typography variant="body2" color="error">
						There was an error fetching your positions.
					</Typography>
				</ListItem>
			) : loading || !displayedPositions ? (
				new Array(3)
					.fill(null)
					.map((_, i) => i)
					.map((i) => (
						<Skeleton
							key={i}
							height={90}
							sx={{ width: "100%", marginBottom: 1 }}
						/>
					))
			) : displayedPositions.length > 0 ? (
				displayedPositions.map((position) => (
					<PositionItem
						key={user + position.market.uniqueKey}
						position={position}
					/>
				))
			) : (
				<ListItem>
					<Typography variant="subtitle2" color="text.disabled">
						You don't have any open position.
					</Typography>
				</ListItem>
			)}
		</List>
	);
};

export default React.memo(PositionList);
