import React from "react";

import DataLink from "@/components/DataLink";
import { popularAssets } from "@/constants";
import {
	type GetAssetsQuery,
	useGetAssetsQuery,
} from "@/graphql/GetAssets.query.generated";
import type { Asset } from "@/graphql/types";
import { useLocalStorage } from "@/localStorage";
import { useErc20Balance } from "@/wagmi";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useDebounce } from "@uidotdev/usehooks";
import { FixedSizeList, type ListChildComponentProps } from "react-window";
import type { Address } from "viem";
import { useAccount, useChainId } from "wagmi";
import Token from "./Token";

export type AssetOption = Pick<
	Asset,
	"address" | "symbol" | "decimals" | "priceUsd"
>;

const AssetItem = React.memo(
	({
		user,
		asset,
		onClick,
		style,
	}: {
		user?: Address;
		asset: Pick<Asset, "address" | "symbol" | "decimals" | "name">;
		onClick: () => void;
		style: ListChildComponentProps["style"];
	}) => {
		const { data } = useErc20Balance(asset?.address, user);

		return (
			<ListItem
				secondaryAction={
					data && (
						<Typography variant="body1" fontWeight={500}>
							{data.format(asset.decimals, 3)}
						</Typography>
					)
				}
				style={style}
				disablePadding
			>
				<ListItemButton onClick={onClick}>
					<ListItemIcon>
						<Token symbol={asset.symbol} size={38} noSymbol />
					</ListItemIcon>
					<ListItemText
						primary={asset.name}
						secondary={
							<>
								{asset.symbol}
								<DataLink
									variant="caption"
									color="text.disabled"
									fontWeight={400}
									fontSize={12}
									data={asset.address}
									type="address"
									ml={2}
									sx={{ textDecoration: "none" }}
								/>
							</>
						}
						primaryTypographyProps={{
							variant: "subtitle1",
							fontWeight: 500,
							textOverflow: "ellipsis",
							overflow: "hidden",
							whiteSpace: "nowrap",
						}}
						secondaryTypographyProps={{ component: "div" }}
					/>
				</ListItemButton>
			</ListItem>
		);
	},
);

const AssetSelect = ({
	assetKey,
}: {
	assetKey: string;
}) => {
	const account = useAccount();
	const chainId = useChainId();

	const [assets, setAssets] =
		useLocalStorage<GetAssetsQuery["assets"]>("assets");

	const [asset, setAsset] = useLocalStorage<AssetOption>(
		assetKey,
		assets?.items?.[0],
	);

	const { data, loading, error } = useGetAssetsQuery({
		variables: {
			chainId,
		},
		fetchPolicy: "cache-first",
	});

	// Cache assets to local storage.
	React.useEffect(() => {
		if (data?.assets) setAssets(data.assets);
	}, [data?.assets, setAssets]);

	const [assetsOpen, setAssetsOpen] = React.useState(false);
	const [searchField, setSearchField] = React.useState("");
	const search = useDebounce(searchField, 300);

	if (!asset) return <Skeleton height={35} width={120} />;

	const filteredAssets = assets?.items?.filter(
		(asset) =>
			asset.address.toLowerCase().includes(search.toLowerCase()) ||
			asset.name.toLowerCase().includes(search.toLowerCase()) ||
			asset.symbol.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<>
			<Button
				variant="text"
				color="info"
				size="large"
				onClick={() => setAssetsOpen(true)}
				sx={{ textTransform: "none" }}
			>
				<Token symbol={asset.symbol} size={24} fontWeight={500} />
				<ExpandMoreIcon color="action" sx={{ marginLeft: 0.5 }} />
			</Button>
			<Dialog
				open={assetsOpen}
				onClose={() => setAssetsOpen(false)}
				maxWidth="xs"
				fullWidth
			>
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
				>
					<DialogTitle>Select a token</DialogTitle>
					<IconButton
						aria-label="close"
						onClick={() => setAssetsOpen(false)}
						sx={{ marginRight: 1 }}
					>
						<CloseIcon />
					</IconButton>
				</Stack>
				<DialogContent sx={{ padding: 0 }} dividers>
					<Stack p={2} paddingBottom={0}>
						<TextField
							value={searchField}
							onChange={(event) => setSearchField(event.target.value)}
							placeholder="Search name or symbol"
							FormHelperTextProps={{ component: "div" }}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon />
									</InputAdornment>
								),
								endAdornment: searchField && (
									<InputAdornment position="end">
										<IconButton edge="end" onClick={() => setSearchField("")}>
											<CloseIcon />
										</IconButton>
									</InputAdornment>
								),
							}}
							size="small"
							fullWidth
						/>
					</Stack>
					<Stack direction="row" flexWrap="wrap" gap={1.5} p={2}>
						{assets?.items
							?.filter((asset) => popularAssets[chainId]?.has(asset.address))
							.map((asset) => (
								<Button
									key={asset.address}
									variant="outlined"
									size="small"
									color="info"
									onClick={() => {
										setSearchField("");
										setAsset(asset);
										setAssetsOpen(false);
									}}
									sx={{ textTransform: "none" }}
								>
									<Token symbol={asset.symbol} size={20} noSymbol />
									{asset.symbol}
								</Button>
							))}
					</Stack>
					<Divider />
					<List
						subheader={
							<ListSubheader>
								{search ? "Search results" : "All tokens"}
							</ListSubheader>
						}
					>
						{filteredAssets?.length ? (
							<FixedSizeList
								height={400}
								width="100%"
								itemSize={80}
								itemCount={filteredAssets.length}
								overscanCount={5}
							>
								{({ index, style }: ListChildComponentProps) => {
									const asset = filteredAssets[index]!;

									return (
										<AssetItem
											key={asset.address}
											user={account.address}
											asset={asset}
											style={style}
											onClick={() => {
												setSearchField("");
												setAsset(asset);
												setAssetsOpen(false);
											}}
										/>
									);
								}}
							</FixedSizeList>
						) : (
							<Stack flex={1} alignItems="center" p={2}>
								<Typography variant="body1" color="text.disabled">
									No results found.
								</Typography>
							</Stack>
						)}
					</List>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default React.memo(AssetSelect);
