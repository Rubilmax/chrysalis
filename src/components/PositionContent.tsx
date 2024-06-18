"use client";

import { ExecutorContext } from "@/app/providers/ExecutorContext";
import { useEthersProvider } from "@/ethers";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import "evm-maths";
import { ExecutorEncoder } from "executooor";
import { memo, useContext, useMemo, useState } from "react";
import { Hex, maxUint256, parseUnits, zeroAddress } from "viem";
import { useAccount, useSendTransaction } from "wagmi";
import { Position } from "./PositionCard";

const PositionContent = ({
	position: { collateral, collateralUsd, borrowAssets, borrowShares, market },
}: {
	position: Omit<Position, "market"> & {
		market: Omit<Position["market"], "collateralAsset" | "collateralPrice"> & {
			collateralAsset: NonNullable<Position["market"]["collateralAsset"]>;
			collateralPrice: NonNullable<Position["market"]["collateralPrice"]>;
		};
	};
}) => {
	const { sendTransaction } = useSendTransaction();
	const provider = useEthersProvider();
	const { executor, isValid } = useContext(ExecutorContext);

	const account = useAccount();
	const { connected } = useSafeAppsSDK();

	const collateralValue = useMemo(
		() => collateral.mulDivDown(market.collateralPrice, parseUnits("1", 36)),
		[collateral, market.collateralPrice],
	);

	const balance = useMemo(
		() =>
			(collateralValue - borrowAssets).mulDivDown(
				parseUnits("1", 36),
				market.collateralPrice,
			),
		[borrowAssets, market.collateralPrice, collateralValue],
	);

	const ltv = useMemo(() => {
		if (collateralValue === 0n) return maxUint256;

		return borrowAssets.wadDiv(collateralValue);
	}, [borrowAssets, collateralValue]);

	const leverage = useMemo(() => {
		if (collateralValue === borrowAssets) return Infinity;

		return collateralValue.wadDiv(collateralValue - borrowAssets).toWadFloat();
	}, [borrowAssets, collateralValue]);

	const maxLtv = useMemo(
		() => market.lltv.wadMulDown(parseUnits("0.998", 18)),
		[market.lltv],
	);

	const maxLeverage = useMemo(() => 1 / (1 - maxLtv.toWadFloat()), [maxLtv]);

	const [withdrawField, setWithdrawField] = useState("");
	const { withdraw, withdrawError } = useMemo(() => {
		if (withdrawField === "") return { withdraw: 0n };

		const [unit, decimals] = withdrawField.split(".");
		if (decimals && decimals.length > market.collateralAsset.decimals)
			return { withdrawError: "Too many decimals" };

		const withdraw = parseUnits(
			withdrawField,
			market.collateralAsset.decimals ?? 18,
		);
		if (withdraw > balance) return { withdrawError: "Insufficient balance" };

		return { withdraw };
	}, [withdrawField]);

	const [leverageField, setLeverageField] = useState(
		Math.min(leverage, maxLeverage),
	);

	const targetLtv = useMemo(
		() =>
			BigInt.WAD -
			BigInt.WAD.wadDivUp(parseUnits(leverageField.toFixed(18), 18)),
		[leverageField],
	);

	const targetCollateral = useMemo(() => {
		if (withdraw == null) return;

		return (balance - withdraw).wadDivDown(BigInt.WAD - targetLtv);
	}, [balance, withdraw, targetLtv]);
	const targetLoan = useMemo(() => {
		if (targetCollateral == null) return;
		if (targetCollateral === 0n) return 0n;

		return targetLtv.wadMulDown(
			targetCollateral.mulDivDown(market.collateralPrice, parseUnits("1", 36)),
		);
	}, [market.collateralPrice, targetCollateral, targetLtv]);

	const resultLtv = useMemo(() => {
		if (
			market.collateralPrice === 0n ||
			targetCollateral == null ||
			targetLoan == null
		)
			return;
		if (targetCollateral === 0n) return 0n;

		return targetLoan.wadDiv(
			targetCollateral.mulDivDown(market.collateralPrice, parseUnits("1", 36)),
		);
	}, [market.collateralPrice, targetCollateral, targetLoan]);

	const errorMessage = !connected
		? "You must log in through the Safe App."
		: !isValid
			? "The executor address provided is invalid."
			: "";

	return (
		<>
			<Stack padding={2}>
				<TextField
					value={withdrawField}
					onChange={(event) =>
						setWithdrawField(
							event.target.value
								.replaceAll(",", ".")
								.replaceAll(/[^0-9.]/g, "")
								.split(".")
								.slice(0, 2)
								.join("."),
						)
					}
					error={!!withdrawError}
					helperText={
						<Stack direction="row" justifyContent="space-between">
							<Typography variant="caption">
								{withdrawError || withdraw == null
									? withdrawError
									: collateralUsd
										? `$${(collateralUsd * withdraw.wadDiv(collateral).toWadFloat()).toFixed(2)}`
										: ""}
							</Typography>
							{balance && (
								<Typography
									variant="caption"
									color="text.secondary"
									onClick={() =>
										setWithdrawField(
											balance.format(market.collateralAsset.decimals),
										)
									}
									sx={{ cursor: "pointer", textDecoration: "underline" }}
								>
									MAX: {balance.format(market.collateralAsset.decimals, 3)}
								</Typography>
							)}
						</Stack>
					}
					FormHelperTextProps={{ component: "div" }}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								{market.collateralAsset?.symbol}

								{withdraw !== 0n && (
									<IconButton edge="end" onClick={() => setWithdrawField("")}>
										<CloseIcon />
									</IconButton>
								)}
							</InputAdornment>
						),
					}}
					sx={{ minWidth: 350 }}
					variant="outlined"
					label="Withdraw"
				/>
				<Typography gutterBottom>Leverage</Typography>
				<Stack spacing={2} direction="row" alignItems="center" sx={{ mb: 5 }}>
					<Typography gutterBottom>low</Typography>
					<Slider
						value={leverageField}
						onChange={(event, value) => setLeverageField(value as number)}
						min={1}
						max={maxLeverage}
						step={0.05}
						marks={new Array(Math.floor(maxLeverage)).fill(0).map((_, i) => ({
							value: i + 1,
							label: `×${i + 1}`,
						}))}
						valueLabelDisplay="auto"
						valueLabelFormat={(value) => `×${value.toFixed(2)}`}
						disabled={
							withdraw == null || balance == null || withdraw >= balance
						}
					/>
					<Typography gutterBottom>max</Typography>
				</Stack>
			</Stack>
			<Divider />
			<Stack direction="row" justifyContent="space-between" padding={2}>
				<Stack alignItems="start">
					<Typography variant="body2">LTV</Typography>
					<Typography variant="body2">Price tolerance</Typography>
				</Stack>
				<Stack alignItems="end">
					<Typography variant="body2">
						{ltv.format(16, 2)}%
						{resultLtv != null &&
						(withdraw !== 0n || leverageField !== leverage) ? (
							<>
								{" "}
								⇾ {resultLtv.format(16, 2)}% /{" "}
								<Typography variant="caption">
									{market.lltv.format(16, 1)}%
								</Typography>
							</>
						) : (
							""
						)}
					</Typography>
					<Typography variant="body2">
						{(BigInt.WAD - ltv.wadDivDown(market.lltv)).format(16, 2)}%
						{resultLtv != null &&
						(withdraw !== 0n || leverageField !== leverage) ? (
							<>
								{" "}
								⇾{" "}
								{(BigInt.WAD - resultLtv.wadDivDown(market.lltv)).format(16, 2)}
								%
							</>
						) : (
							""
						)}
					</Typography>
				</Stack>
			</Stack>
			<Divider />
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="end"
				padding={2}
			>
				<Typography variant="caption" color="error">
					{errorMessage}
				</Typography>
				<Button
					variant="contained"
					startIcon={withdraw === balance ? <CloseIcon /> : <EditIcon />}
					disableElevation
					onClick={async () => {
						if (!isValid) return;

						const encoder = new ExecutorEncoder(executor, provider);

						if (connected) {
						} else {
							const marketParams = {
								collateralToken: market.collateralAsset?.address ?? zeroAddress,
								loanToken: market.loanAsset.address,
								irm: market.irmAddress,
								oracle: market.oracleAddress,
								lltv: market.lltv,
							};

							const { value, data } = await encoder
								.morphoBlueRepay(
									market.morphoBlue.address,
									marketParams,
									0n,
									borrowShares,
									account.address!,
									[],
								)
								.morphoBlueWithdrawCollateral(
									market.morphoBlue.address,
									marketParams,
									collateral,
									account.address!,
									account.address!,
								)
								.populateExec();

							console.log({ to: executor, value, data: data as Hex });

							sendTransaction({ to: executor, value, data: data as Hex });
						}
					}}
					disabled={!isValid || !connected || !!withdrawError}
				>
					{withdraw === balance ? "Close" : "Adjust"}
				</Button>
			</Stack>
		</>
	);
};

export default memo(PositionContent);
