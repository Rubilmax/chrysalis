"use client";

import { ExecutorContext } from "@/app/providers";
import { useEthersProvider } from "@/ethers";
import { GetUserMarketPositionsQuery } from "@/graphql/GetMarketPositions.query.generated";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import "evm-maths";
import { ExecutorEncoder } from "executooor";
import { memo, useContext, useMemo, useState } from "react";
import { Hex, parseUnits, zeroAddress } from "viem";
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

	const marketParams = {
		collateralToken: position.market.collateralAsset?.address ?? zeroAddress,
		loanToken: position.market.loanAsset.address,
		irm: position.market.irmAddress,
		oracle: position.market.oracleAddress,
		lltv: position.market.lltv,
	};

	const defaultCollateralField = position.collateral.format(collateralDecimals);
	const [collateralField, setCollateralField] = useState(
		defaultCollateralField,
	);
	const [collateralError, setCollateralError] = useState("");
	const targetCollateral = useMemo(() => {
		if (collateralField.split(".")[1]?.length > collateralDecimals) {
			setCollateralError("Too many decimals");
			return;
		}

		try {
			const collateral = parseUnits(collateralField, collateralDecimals ?? 18);

			setCollateralError("");

			return collateral;
		} catch {
			setCollateralError("Invalid amount");
		}
	}, [collateralField]);

	const defaultLoanField = position.borrowAssets.format(
		position.market.loanAsset.decimals,
	);
	const [loanField, setLoanField] = useState(defaultLoanField);
	const [loanError, setLoanError] = useState("");
	const targetLoan = useMemo(() => {
		if (loanField.split(".")[1]?.length > position.market.loanAsset.decimals) {
			setLoanError("Too many decimals");
			return;
		}

		try {
			const loan = parseUnits(
				loanField,
				position.market.loanAsset.decimals ?? 18,
			);

			setLoanError("");

			return loan;
		} catch {
			setLoanError("Invalid amount");
		}
	}, [loanField]);

	const targetCollateralValue = useMemo(() => {
		if (position.market.collateralPrice == null || targetCollateral == null)
			return;

		return targetCollateral.mulDivDown(
			position.market.collateralPrice,
			parseUnits("1", 36),
		);
	}, [position]);

	const ltv = useMemo(() => {
		if (targetCollateralValue == null) return;

		return targetLoan?.wadDiv(targetCollateralValue).format(16, 3);
	}, [targetCollateralValue, targetLoan]);

	const leverage = useMemo(() => {
		if (targetLoan == null) return;

		return targetCollateralValue
			?.wadDiv(targetCollateralValue - targetLoan)
			.toWadFloat();
	}, [targetCollateralValue, targetLoan]);

	return (
		<Paper key={position.market.uniqueKey}>
			<Box padding={2} display="flex" alignItems="center">
				<Box display="flex" flexDirection="column">
					<Typography variant="h4">
						{position.market.collateralAsset?.symbol + " /" ?? "[IDLE]"}{" "}
						{position.market.loanAsset.symbol}
					</Typography>
					<Box display="flex">
						<Chip
							size="small"
							label={`${position.market.lltv.format(16, 1)}%`}
						/>
					</Box>
				</Box>
				<Box marginLeft={3}>
					<Typography variant="h5">
						{borrowApy ? (borrowApy * 100).toFixed(2) : 0}%
					</Typography>
				</Box>
			</Box>
			<Divider />
			<Box padding={2} display="flex" flexDirection="column">
				<TextField
					value={collateralField}
					onChange={(event) =>
						setCollateralField(
							event.target.value
								.replaceAll(",", ".")
								.replaceAll(/[^0-9.]/g, "")
								.split(".")
								.slice(0, 2)
								.join("."),
						)
					}
					error={!!collateralError}
					helperText={
						collateralError || targetCollateral == null
							? collateralError
							: position.collateralUsd
								? `$${(position.collateralUsd * targetCollateral.wadDiv(position.collateral).toWadFloat()).toFixed(2)}`
								: ""
					}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								{position.market.collateralAsset?.symbol}

								{targetCollateral !== position.collateral && (
									<IconButton
										edge="end"
										onClick={() => setCollateralField(defaultCollateralField)}
									>
										<RestartAltIcon />
									</IconButton>
								)}
							</InputAdornment>
						),
					}}
					style={{ minWidth: 300 }}
					variant="outlined"
					label="Collateral"
				/>
				<TextField
					value={loanField}
					onChange={(event) =>
						setLoanField(
							event.target.value
								.replaceAll(",", ".")
								.replaceAll(/[^0-9.]/g, "")
								.split(".")
								.slice(0, 2)
								.join("."),
						)
					}
					error={!!loanError}
					helperText={
						loanError || targetLoan == null
							? loanError
							: position.borrowAssetsUsd
								? `$${(position.borrowAssetsUsd * targetLoan.wadDiv(position.borrowAssets).toWadFloat()).toFixed(2)}`
								: ""
					}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								{position.market.loanAsset.symbol}

								{targetLoan !== position.borrowAssets && (
									<IconButton
										edge="end"
										onClick={() => setLoanField(defaultLoanField)}
									>
										<RestartAltIcon />
									</IconButton>
								)}
							</InputAdornment>
						),
					}}
					style={{ minWidth: 300 }}
					variant="outlined"
					label="Loan"
				/>
				<Typography>LTV: {ltv}%</Typography>
				<Typography>Leverage: {leverage}</Typography>
				<Slider
					value={leverage ?? 0}
					valueLabelDisplay="auto"
					min={1}
					max={10}
				/>
				<Box display="flex" justifyItems="right">
					<Button
						variant="contained"
						disableElevation
						onClick={async () => {
							if (!isValid) return;

							const encoder = new ExecutorEncoder(executor, provider);

							if (connected) {
							} else {
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
						disabled={!isValid}
					>
						Close position
					</Button>
				</Box>
			</Box>
		</Paper>
	);
};

export default memo(Position);
