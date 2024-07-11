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

import AssetSelect, { type AssetOption } from "@/components/AssetSelect";
import LeverageField from "@/components/LeverageField";
import MarketTitle from "@/components/MarketTitle";
import {
	type GetAssetMarketsQuery,
	useGetAssetMarketsQuery,
} from "@/graphql/GetAssetMarkets.query.generated";
import type { Asset } from "@/graphql/types";
import { useLocalStorage } from "@/localStorage";
import { usePositionDetails } from "@/position";
import React from "react";
import { type Hex, parseUnits } from "viem";
import { useAccount, useChainId } from "wagmi";

const assetKey = "selectedAsset";
const marketKey = "selectedMarket";

const MarketOption = React.memo(
	({
		market,
		amount,
		leverage,
	}: {
		market: NonNullable<GetAssetMarketsQuery["markets"]["items"]>[number] & {
			collateralAsset: Pick<Asset, "address">;
			collateralPrice: bigint;
		};
		amount: bigint;
		leverage: number;
	}) => {
		const {
			targetBalance,
			targetPositionApy,
			resultLtv,
			targetCollateral,
			targetLoan,
		} = usePositionDetails({
			market,
			balance: amount,
			leverage,
		});

		return (
			<ToggleButton
				key={market.id}
				value={market.uniqueKey}
				sx={{ padding: 0 }}
			>
				<MarketTitle market={market} variant="subtitle1" />
			</ToggleButton>
		);
	},
);

const hasCollateralAssetAndPrice = <
	C extends {},
	T extends { collateralAsset: C | null; collateralPrice: bigint | null },
>(
	market: T,
): market is T & { collateralAsset: C; collateralPrice: bigint } =>
	market.collateralAsset != null && market.collateralPrice != null;

const MarketOptions = React.memo(
	({
		asset,
		amount,
		leverage,
	}: { asset: AssetOption; amount: bigint; leverage: number }) => {
		const chainId = useChainId();

		const { data, loading, error } = useGetAssetMarketsQuery({
			variables: {
				chainId,
				asset: asset.address,
			},
			skip: !asset,
		});

		const [selected, setSelected] = useLocalStorage<Hex>(marketKey);

		return (
			<ToggleButtonGroup
				orientation="vertical"
				value={selected}
				exclusive
				onChange={(_, value) => setSelected(value)}
			>
				{data?.markets.items
					?.filter(hasCollateralAssetAndPrice)
					.map((market, i) => (
						<MarketOption
							key={market.id}
							market={market}
							amount={amount}
							leverage={leverage}
						/>
					))}
			</ToggleButtonGroup>
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
			return { amountError: "Insufficient balance" };

		return { amount };
	}, [amountField, balance, asset?.decimals]);

	const [leverageField, setLeverageField] = React.useState(1);

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
							max={1 / (1 - 0.985)}
						/>
					</Stack>

					{asset && amount != null && (
						<Stack marginTop={2}>
							<MarketOptions
								asset={asset}
								amount={amount}
								leverage={leverageField}
							/>
						</Stack>
					)}
				</Stack>
			</Paper>
		</Stack>
	);
}
