"use client";

import "evm-maths";

import { useErc20Balance } from "@/wagmi";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

import Apy from "@/components/Apy";
import AssetSelect, { type AssetOption } from "@/components/AssetSelect";
import LeverageField from "@/components/LeverageField";
import MarketDetails from "@/components/MarketDetails";
import MarketIcon from "@/components/MarketIcon";
import MarketTitle from "@/components/MarketTitle";
import PositionApy from "@/components/PositionApy";
import { parseNumber } from "@/format";
import {
	type GetAssetMarketsQuery,
	useGetAssetMarketsQuery,
} from "@/graphql/GetAssetMarkets.query.generated";
import type { Asset, MarketWarning } from "@/graphql/types";
import { useLocalStorage } from "@/localStorage";
import { usePositionDetails } from "@/position";
import { type AssetYields, useAssetYields } from "@/yield";
import DangerousIcon from "@mui/icons-material/Dangerous";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import React from "react";
import { type Hex, parseUnits } from "viem";
import { useAccount, useChainId } from "wagmi";

const defaultMaxLeverage = 1 / (1 - 0.985);
const assetKey = "selectedAsset";

const MarketItem = React.memo(
	({
		market,
		amount,
		leverage,
		collateralYields,
		onClick,
		description,
	}: {
		market: NonNullable<GetAssetMarketsQuery["markets"]["items"]>[number] & {
			collateralAsset: Pick<Asset, "address">;
			collateralPrice: bigint;
		};
		amount: bigint;
		leverage: number;
		collateralYields?: AssetYields;
		onClick?: React.MouseEventHandler<HTMLDivElement>;
		description?: React.ReactNode;
	}) => {
		const { targetLoan, targetCollateralValue } = usePositionDetails({
			market,
			balance: amount,
			leverage,
		});

		return (
			<ListItem
				secondaryAction={
					<PositionApy
						market={market} // TODO: use target borrow APY
						collateralValue={targetCollateralValue}
						borrowAssets={targetLoan}
						collateralYields={collateralYields}
					/>
				}
				disablePadding
			>
				<ListItemButton onClick={onClick}>
					<ListItemIcon>
						<MarketIcon market={market} />
					</ListItemIcon>
					<ListItemText
						primary={<MarketTitle market={market} />}
						secondary={description}
						primaryTypographyProps={{ component: "div" }}
						secondaryTypographyProps={{ component: "div" }}
						sx={{ marginLeft: 1 }}
					/>
				</ListItemButton>
			</ListItem>
		);
	},
);

const MarketOption = React.memo(
	({
		market,
		amount,
		leverage,
		collateralYields,
	}: {
		market: NonNullable<GetAssetMarketsQuery["markets"]["items"]>[number] & {
			collateralAsset: Pick<Asset, "address">;
			collateralPrice: bigint;
		};
		amount: bigint;
		leverage: number;
		collateralYields?: AssetYields;
	}) => {
		const { targetLoan, targetCollateralValue } = usePositionDetails({
			market,
			balance:
				amount === 0n
					? parseUnits("1", market.collateralAsset.decimals)
					: amount,
			leverage,
		});

		return (
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				flex={1}
			>
				<MarketDetails
					market={{ ...market, collateralAsset: null }}
					variant="subtitle1"
				/>
				<Stack alignItems="flex-end" marginRight={2}>
					<PositionApy
						placement="right"
						market={market} // TODO: use target borrow APY
						collateralValue={targetCollateralValue}
						borrowAssets={targetLoan}
						collateralYields={collateralYields}
					/>
					<Apy
						variant="caption"
						placement="right"
						title="The underlying market's borrow APY"
						apy={market.state?.borrowApy}
						dailyApy={market.dailyApys?.borrowApy}
						weeklyApy={market.weeklyApys?.borrowApy}
						monthlyApy={market.monthlyApys?.borrowApy}
					/>
				</Stack>
			</Stack>
		);
	},
);

const MarketOptions = React.memo(
	({
		asset,
		amount,
		leverage,
		setMaxLeverage,
	}: {
		asset: AssetOption;
		amount: bigint;
		leverage: number;
		setMaxLeverage: React.Dispatch<React.SetStateAction<number>>;
	}) => {
		const chainId = useChainId();

		const [collateralYields] = useAssetYields(asset.address);

		const { data, loading, error } = useGetAssetMarketsQuery({
			variables: {
				chainId,
				asset: asset.address,
			},
			skip: !asset,
		});

		React.useEffect(() => {
			setMaxLeverage(
				Math.max(
					...(data?.markets.items?.map(
						(market) => 1 / (1 - market.lltv.toWadFloat()),
					) ?? [defaultMaxLeverage]),
				),
			);
		}, [data?.markets.items, setMaxLeverage]);

		const [selectedId, setSelectedId] = React.useState<Hex>();

		const markets = data?.markets.items?.filter(
			(
				market,
			): market is typeof market & {
				collateralAsset: NonNullable<(typeof market)["collateralAsset"]>;
				collateralPrice: bigint;
			} =>
				market.collateralAsset != null &&
				market.collateralPrice != null &&
				!market.warnings?.some(
					({ type }) => type === "incorrect_loan_exchange_rate",
				),
		);
		const selectedMarket = markets?.find(
			(market) => market.uniqueKey === selectedId,
		);

		const [showMore, setShowMore] = React.useState(false);

		const marketsInsufficientLltv = markets?.filter(
			(market) => 1 / (1 - market.lltv.toWadFloat()) < leverage,
		);
		const marketsWarnings = markets?.map((market) => ({
			...market,
			yellowWarnings:
				market.warnings?.filter(({ level }) => level === "YELLOW") ?? [],
			redWarning: market.warnings?.find(({ level }) => level === "RED"),
		}));
		const marketsNoRedWarnings = marketsWarnings?.filter(
			(market): market is typeof market & { redWarning: undefined } =>
				market.redWarning == null,
		);
		const marketsYellowWarnings = marketsNoRedWarnings?.filter(
			({ yellowWarnings }) => yellowWarnings.length > 0,
		);
		const marketsRedWarnings = marketsWarnings?.filter(
			(market): market is typeof market & { redWarning: MarketWarning } =>
				market.redWarning != null,
		);

		// const displayedMarkets = marketsNoRedWarnings?.concat(
		// 	selectedMarket
		// 		? [
		// 				{
		// 					...selectedMarket,
		// 					yellowWarnings:
		// 						selectedMarket.warnings?.filter(
		// 							({ level }) => level === "YELLOW",
		// 						) ?? [],
		// 					redWarning: selectedMarket.warnings?.find(
		// 						({ level }) => level === "RED",
		// 					),
		// 				},
		// 			]
		// 		: [],
		// );

		return (
			<Stack marginTop={2} spacing={2}>
				{amount && (
					<>
						<Stack direction="row" justifyContent="space-between">
							<Typography variant="subtitle2">
								{selectedMarket ? "Selected loan" : "Recommended loans"}
							</Typography>
							<Button
								onClick={() => setShowMore(true)}
								color="inherit"
								size="small"
								sx={{ fontSize: 12 }}
							>
								Show more
							</Button>
						</Stack>
						<ToggleButtonGroup
							orientation="vertical"
							value={selectedId}
							exclusive
							onChange={(_, value) => setSelectedId(value)}
						>
							{marketsNoRedWarnings
								?.filter(
									(market) => 1 / (1 - market.lltv.toWadFloat()) >= leverage,
								)
								.map((market, i) => (
									<Collapse
										key={market.id}
										in={!selectedMarket || selectedId === market.uniqueKey}
										appear
									>
										<ToggleButton
											value={market.uniqueKey}
											sx={{ width: "100%", padding: 0 }}
										>
											<MarketOption
												market={market}
												amount={amount}
												leverage={leverage}
												collateralYields={collateralYields}
											/>
										</ToggleButton>
									</Collapse>
								))}
						</ToggleButtonGroup>

						{selectedMarket && (
							<Stack direction="row" justifyContent="space-between">
								<Stack alignItems="start">
									<Typography variant="body2">Price tolerance</Typography>
								</Stack>
								<Stack alignItems="end">
									<Typography variant="body2">
										{(
											BigInt.WAD -
											parseNumber(1 - 1 / leverage).wadDivDown(
												selectedMarket.lltv,
											)
										).format(16, 2)}
										%
									</Typography>
								</Stack>
							</Stack>
						)}
					</>
				)}

				<Button
					variant="contained"
					color="primary"
					sx={{ paddingTop: 1.5, paddingBottom: 1.5 }}
					disabled={!amount || !selectedMarket}
				>
					{amount === 0n
						? "Enter an amount"
						: !selectedMarket
							? "Select a market"
							: "Deposit"}
				</Button>

				<Dialog
					open={showMore}
					onClose={() => setShowMore(false)}
					maxWidth="xs"
					fullWidth
				>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
					>
						<DialogTitle>All markets</DialogTitle>
						<IconButton
							aria-label="close"
							onClick={() => setShowMore(false)}
							sx={{ marginRight: 1 }}
						>
							<CloseIcon />
						</IconButton>
					</Stack>
					<DialogContent sx={{ padding: 0 }} dividers>
						{!!marketsInsufficientLltv?.length && (
							<List
								subheader={
									<ListSubheader>
										Markets with insufficient leverage
									</ListSubheader>
								}
							>
								{marketsInsufficientLltv.map((market) => (
									<MarketItem
										key={market.uniqueKey}
										market={market}
										amount={amount}
										leverage={leverage}
										collateralYields={collateralYields}
										onClick={() => {
											setSelectedId(market.uniqueKey);
											setShowMore(false);
										}}
									/>
								))}
							</List>
						)}
						{!!marketsYellowWarnings?.length && (
							<List
								subheader={
									<ListSubheader
										component={Typography}
										sx={(theme) => ({ color: theme.palette.warning.main })}
									>
										<DangerousIcon sx={{ marginRight: 1 }} />
										Markets with yellow warnings
									</ListSubheader>
								}
							>
								{marketsYellowWarnings.map((market) => (
									<MarketItem
										key={market.uniqueKey}
										market={market}
										amount={amount}
										leverage={leverage}
										collateralYields={collateralYields}
										onClick={() => {
											setSelectedId(market.uniqueKey);
											setShowMore(false);
										}}
										description={
											<Typography
												variant="caption"
												sx={(theme) => ({ color: theme.palette.warning.main })}
											>
												{market.yellowWarnings
													.map(({ type }) => type.replaceAll("_", " "))
													.join(", ")}
											</Typography>
										}
									/>
								))}
							</List>
						)}
						{!!marketsRedWarnings?.length && (
							<List
								subheader={
									<ListSubheader
										component={Typography}
										sx={(theme) => ({ color: theme.palette.error.main })}
									>
										<DangerousIcon sx={{ marginRight: 1 }} />
										Markets with red warnings
									</ListSubheader>
								}
							>
								{marketsRedWarnings.map((market) => (
									<MarketItem
										key={market.uniqueKey}
										market={market}
										amount={amount}
										leverage={leverage}
										collateralYields={collateralYields}
										onClick={() => {
											setSelectedId(market.uniqueKey);
											setShowMore(false);
										}}
										description={
											<Typography
												variant="caption"
												sx={(theme) => ({ color: theme.palette.error.main })}
											>
												{market.redWarning.type.replaceAll("_", " ")}
											</Typography>
										}
									/>
								))}
							</List>
						)}
					</DialogContent>
				</Dialog>
			</Stack>
		);
	},
);

export default function Home() {
	const account = useAccount();

	const [asset] = useLocalStorage<AssetOption>(assetKey);

	const { data: balance } = useErc20Balance(asset?.address, account.address);

	const [amountField, setAmountField] = React.useState("");
	const { amount, amountError } = React.useMemo(() => {
		if (!asset?.decimals || amountField === "") return { amount: 0n };

		const [unit, decimals] = amountField.split(".");
		if (decimals && decimals.length > asset.decimals)
			return { amountError: "Too many decimals" };

		const amount = parseUnits(amountField, asset.decimals ?? 18);
		if (balance != null && amount > balance)
			return { amount, amountError: "Insufficient balance" };

		return { amount };
	}, [amountField, balance, asset?.decimals]);

	const [leverageField, setLeverageField] = React.useState(1);
	const [maxLeverage, setMaxLeverage] = React.useState(defaultMaxLeverage);

	return (
		<Stack alignItems="center">
			<Paper variant="transparent">
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
											size="small"
											edge="end"
											onClick={() => setAmountField("")}
											sx={{ marginRight: 0.5 }}
										>
											<CloseIcon />
										</IconButton>
									)}

									<AssetSelect assetKey={assetKey} />
								</InputAdornment>
							),
						}}
						sx={{ maxWidth: 450 }}
						size="large"
						variant="filled"
						label="Leverage"
						placeholder="0"
						InputLabelProps={{ shrink: true }}
					/>

					<Stack
						direction="row"
						alignItems="center"
						marginTop={2}
						pl={2}
						pr={2}
					>
						<LeverageField
							value={leverageField}
							setValue={setLeverageField}
							max={maxLeverage}
							disabled={!amount}
						/>
					</Stack>

					{asset && amount != null && (
						<MarketOptions
							asset={asset}
							amount={amount}
							leverage={leverageField}
							setMaxLeverage={setMaxLeverage}
						/>
					)}
				</Stack>
			</Paper>
		</Stack>
	);
}
