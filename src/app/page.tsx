"use client";

import "evm-maths";

import { useErc20Balance } from "@/wagmi";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import AssetSelect, { type AssetOption } from "@/components/AssetSelect";
import { useGetAssetMarketsQuery } from "@/graphql/GetAssetMarkets.query.generated";
import { useLocalStorage } from "@/localStorage";
import React from "react";
import { parseUnits } from "viem";
import { useAccount, useChainId } from "wagmi";

const assetKey = "selectedAsset";

const MarketOptions = ({ asset }: { asset: AssetOption }) => {
	const chainId = useChainId();

	const { data, loading, error } = useGetAssetMarketsQuery({
		variables: {
			chainId,
			asset: asset.address,
		},
		skip: !asset,
	});

	return null;
};

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

					{asset && <MarketOptions asset={asset} />}
				</Stack>
			</Paper>
		</Stack>
	);
}
