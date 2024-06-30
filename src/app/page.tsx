"use client";

import "evm-maths";
import Token from "@/components/Token";
import { useGetAssetsQuery } from "@/graphql/GetAssets.query.generated";
import type { Asset } from "@/graphql/types";
import { useErc20Balance } from "@/wagmi";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useDebounce, useLocalStorage } from "@uidotdev/usehooks";
import { FixedSizeList, type ListChildComponentProps } from "react-window";

import DataLink from "@/components/DataLink";
import Divider from "@mui/material/Divider";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import React from "react";
import { type Address, parseUnits } from "viem";
import { useAccount, useChainId } from "wagmi";

const AssetOption = React.memo(
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
				key={asset.address}
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

export default function Home() {
	const account = useAccount();
	const chainId = useChainId();

	const { data, loading, error } = useGetAssetsQuery({
		variables: {
			chainId,
		},
	});

	const [asset, setAsset] = useLocalStorage<
		Pick<Asset, "address" | "symbol" | "decimals" | "priceUsd"> | undefined
	>("selectedAsset");
	React.useEffect(() => {
		const firstAsset = data?.assets.items?.[0];
		if (!firstAsset) return;

		setAsset((asset) => {
			if (asset == null) return firstAsset;

			return asset;
		});
	}, [data, setAsset]);

	const { data: balance } = useErc20Balance(asset?.address, account.address);

	const [amountField, setAmountField] = React.useState("");
	const { amount, amountError } = React.useMemo(() => {
		if (!asset?.decimals || amountField === "") return { amount: 0n };

		const [unit, decimals] = amountField.split(".");
		if (decimals && decimals.length > asset.decimals)
			return { amountError: "Too many decimals" };

		const amount = parseUnits(amountField, asset.decimals ?? 18);
		if (balance != null && amount > balance)
			return { amountError: "Insufficient balance" };

		return { amount };
	}, [amountField, balance, asset?.decimals]);

	const [assetsOpen, setAssetsOpen] = React.useState(false);

	const [searchField, setSearchField] = React.useState("");
	const search = useDebounce(searchField, 300);

	const filteredAssets = data?.assets.items?.filter(
		(asset) =>
			asset.address.toLowerCase().includes(search.toLowerCase()) ||
			asset.name.toLowerCase().includes(search.toLowerCase()) ||
			asset.symbol.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<Stack alignItems="center">
			<Paper>
				<Stack p={2}>
					<TextField
						value={amountField}
						onChange={(event) =>
							setAmountField(
								event.target.value
									.replaceAll(",", ".")
									.replaceAll(/[^0-9.]/g, "")
									.split(".")
									.slice(0, 2)
									.join("."),
							)
						}
						error={!!amountError}
						helperText={
							<Stack direction="row" justifyContent="space-between">
								<Typography variant="caption">
									{amountError || amount == null
										? amountError
										: amount && asset?.priceUsd != null
											? `$${(asset.priceUsd * amount.toWadFloat()).toFixed(2)}`
											: ""}
								</Typography>
								{asset && balance && (
									<Typography
										variant="caption"
										color="text.secondary"
										onClick={() =>
											setAmountField(balance.format(asset.decimals))
										}
										sx={{ cursor: "pointer", textDecoration: "underline" }}
									>
										MAX: {balance.format(asset.decimals, 3)}
									</Typography>
								)}
							</Stack>
						}
						FormHelperTextProps={{ component: "div" }}
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									{amount !== 0n && (
										<IconButton
											edge="end"
											onClick={() => setAmountField("")}
											sx={{ marginRight: 0.5 }}
										>
											<CloseIcon />
										</IconButton>
									)}

									{asset ? (
										<Button
											variant="outlined"
											color="info"
											onClick={() => setAssetsOpen(true)}
											sx={{ textTransform: "none" }}
										>
											<Token symbol={asset.symbol} size={20} />
											<ExpandMoreIcon />
										</Button>
									) : (
										<Skeleton height={60} width={120} />
									)}
								</InputAdornment>
							),
						}}
						sx={{ minWidth: 350 }}
						variant="outlined"
						label="Deposit"
					/>
				</Stack>
			</Paper>

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
					<Stack p={2}>
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
							fullWidth
						/>
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
										<AssetOption
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
		</Stack>
	);
}
