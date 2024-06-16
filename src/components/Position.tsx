"use client";

import { ExecutorContext } from "@/app/providers";
import { useEthersProvider } from "@/ethers";
import { GetUserMarketPositionsQuery } from "@/graphql/GetMarketPositions.query.generated";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
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

const Position = ({
	position,
}: {
	position: GetUserMarketPositionsQuery["userByAddress"]["marketPositions"][number];
}) => {
	const borrowApy = position.market.dailyApys?.borrowApy;
	const collateralDecimals = position.market.collateralAsset?.decimals ?? 0;

	const { sendTransaction } = useSendTransaction();
	const provider = useEthersProvider();
	const { executor, isValid } = useContext(ExecutorContext);

	const account = useAccount();
	const { connected } = useSafeAppsSDK();

	const collateralValue = useMemo(() => {
		if (position.market.collateralPrice == null) return;

		return position.collateral.mulDivDown(
			position.market.collateralPrice,
			parseUnits("1", 36),
		);
	}, [position.collateral, position.market.collateralPrice]);

	const balance = useMemo(() => {
		if (position.market.collateralPrice == null) return;

		return (collateralValue! - position.borrowAssets).mulDivDown(
			parseUnits("1", 36),
			position.market.collateralPrice,
		);
	}, [position.borrowAssets, position.market.collateralPrice, collateralValue]);

	const ltv = useMemo(() => {
		if (!collateralValue) return maxUint256;

		return position.borrowAssets.wadDiv(collateralValue);
	}, [position.borrowAssets, collateralValue]);

	const leverage = useMemo(() => {
		if (collateralValue == null) return 0;
		if (collateralValue === position.borrowAssets) return Infinity;

		return collateralValue
			.wadDiv(collateralValue - position.borrowAssets)
			.toWadFloat();
	}, [position.borrowAssets, collateralValue]);

	const maxLtv = useMemo(
		() => position.market.lltv.wadMulDown(parseUnits("0.998", 18)),
		[position.market.lltv],
	);

	const maxLeverage = useMemo(() => 1 / (1 - maxLtv.toWadFloat()), [maxLtv]);

	const [withdrawField, setWithdrawField] = useState("");
	const [withdrawError, setWithdrawError] = useState("");
	const withdraw = useMemo(() => {
		if (withdrawField === "") return 0n;

		if (withdrawField.split(".")[1]?.length > collateralDecimals) {
			setWithdrawError("Too many decimals");
			return;
		}

		setWithdrawError("");

		return parseUnits(withdrawField, collateralDecimals ?? 18);
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
		if (withdraw == null || balance == null) return;

		return (balance - withdraw).wadDivDown(BigInt.WAD - targetLtv);
	}, [balance, withdraw, targetLtv]);
	const targetLoan = useMemo(() => {
		if (targetCollateral == null || position.market.collateralPrice == null)
			return;
		if (targetCollateral === 0n) return 0n;

		return targetLtv.wadMulDown(
			targetCollateral.mulDivDown(
				position.market.collateralPrice,
				parseUnits("1", 36),
			),
		);
	}, [position.market.collateralPrice, targetCollateral, targetLtv]);

	const resultLtv = useMemo(() => {
		if (
			!position.market.collateralPrice ||
			targetCollateral == null ||
			targetLoan == null
		)
			return;
		if (targetCollateral === 0n) return 0n;

		return targetLoan.wadDiv(
			targetCollateral.mulDivDown(
				position.market.collateralPrice,
				parseUnits("1", 36),
			),
		);
	}, [position.market.collateralPrice, targetCollateral, targetLoan]);

	const errorMessage = !connected
		? "You must log in through the Safe App."
		: !isValid
			? "The executor address provided is invalid."
			: "";

	return (
		<Paper key={position.market.uniqueKey}>
			<Stack direction="row" alignItems="center" padding={2}>
				<Stack>
					<Typography variant="h4">
						{position.market.collateralAsset?.symbol + " /" ?? "[IDLE]"}{" "}
						{position.market.loanAsset.symbol}
					</Typography>
					<Stack direction="row">
						<Chip
							size="small"
							label={`${position.market.lltv.format(16, 1)}%`}
						/>
					</Stack>
				</Stack>
				<Box marginLeft={3}>
					<Typography variant="h5">
						{borrowApy ? (borrowApy * 100).toFixed(2) : 0}%
					</Typography>
				</Box>
			</Stack>
			<Divider />
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
									: position.collateralUsd
										? `$${(position.collateralUsd * withdraw.wadDiv(position.collateral).toWadFloat()).toFixed(2)}`
										: ""}
							</Typography>
							{balance && (
								<Typography
									variant="caption"
									color="text.secondary"
									onClick={() =>
										setWithdrawField(balance.format(collateralDecimals))
									}
									sx={{ cursor: "pointer", textDecoration: "underline" }}
								>
									MAX: {balance.format(collateralDecimals, 3)}
								</Typography>
							)}
						</Stack>
					}
					FormHelperTextProps={{ component: "div" }}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								{position.market.collateralAsset?.symbol}

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
									{position.market.lltv.format(16, 1)}%
								</Typography>
							</>
						) : (
							""
						)}
					</Typography>
					<Typography variant="body2">
						{(BigInt.WAD - ltv.wadDivDown(position.market.lltv)).format(16, 2)}%
						{resultLtv != null &&
						(withdraw !== 0n || leverageField !== leverage) ? (
							<>
								{" "}
								⇾{" "}
								{(
									BigInt.WAD - resultLtv.wadDivDown(position.market.lltv)
								).format(16, 2)}
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
								collateralToken:
									position.market.collateralAsset?.address ?? zeroAddress,
								loanToken: position.market.loanAsset.address,
								irm: position.market.irmAddress,
								oracle: position.market.oracleAddress,
								lltv: position.market.lltv,
							};

							const { value, data } = await encoder
								.morphoBlueRepay(
									position.market.morphoBlue.address,
									marketParams,
									0n,
									position.borrowShares,
									account.address!,
									[],
								)
								.morphoBlueWithdrawCollateral(
									position.market.morphoBlue.address,
									marketParams,
									position.collateral,
									account.address!,
									account.address!,
								)
								.populateExec();

							console.log({ to: executor, value, data: data as Hex });

							sendTransaction({ to: executor, value, data: data as Hex });
						}
					}}
					disabled={!isValid || !connected}
				>
					{withdraw === balance ? "Close" : "Adjust"}
				</Button>
			</Stack>
		</Paper>
	);
};

export default memo(Position);
