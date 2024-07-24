import { ExecutorContext } from "@/app/providers/ExecutorContext";
import {
	useGetPositionTx,
	usePositionApy,
	usePositionDetails,
} from "@/position";
import { useDeployContract } from "@/wagmi";
import { useSendTransaction } from "@/wagmi";
import { useAssetYields } from "@/yield";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React from "react";
import { maxUint256, parseUnits } from "viem";
import type { Position } from "../app/positions/[user]/[market]/page";
import LeverageField from "./LeverageField";
import PositionSummary from "./PositionSummary";
import Token from "./Token";

const PositionContent = ({
	position,
}: {
	position: Omit<Position, "market"> & {
		market: Omit<Position["market"], "collateralAsset" | "collateralPrice"> & {
			collateralAsset: NonNullable<Position["market"]["collateralAsset"]>;
			collateralPrice: NonNullable<Position["market"]["collateralPrice"]>;
		};
	};
}) => {
	const {
		collateral,
		collateralUsd,
		borrowAssets,
		borrowShares,
		market: { loanAsset, collateralAsset, collateralPrice, ...market },
	} = position;

	const {
		request: { sendTransaction },
	} = useSendTransaction();
	const {
		request: { deployContract },
		receipt,
	} = useDeployContract();
	const { executor } = React.useContext(ExecutorContext);

	const { connected, sdk } = useSafeAppsSDK();

	const collateralValue = React.useMemo(
		() => collateral.mulDivDown(collateralPrice, parseUnits("1", 36)),
		[collateral, collateralPrice],
	);

	const balance = React.useMemo(
		() =>
			(collateralValue - borrowAssets).mulDivDown(
				parseUnits("1", 36),
				collateralPrice,
			),
		[borrowAssets, collateralPrice, collateralValue],
	);

	const ltv = React.useMemo(() => {
		if (borrowAssets === 0n) return 0n;
		if (collateralValue === 0n) return maxUint256;

		return borrowAssets.wadDiv(collateralValue);
	}, [borrowAssets, collateralValue]);

	const leverage = React.useMemo(() => {
		if (collateralValue === 0n) return 1;
		if (collateralValue === borrowAssets) return Number.POSITIVE_INFINITY;

		return collateralValue.wadDiv(collateralValue - borrowAssets).toWadFloat();
	}, [borrowAssets, collateralValue]);

	const maxLtv = React.useMemo(
		() => market.lltv.wadMulDown(parseUnits("0.998", 18)),
		[market.lltv],
	);

	const maxLeverage = React.useMemo(
		() => 1 / (1 - maxLtv.toWadFloat()),
		[maxLtv],
	);

	const [withdrawField, setWithdrawField] = React.useState("");
	const { withdraw, withdrawError } = React.useMemo(() => {
		if (withdrawField === "") return { withdraw: 0n };

		const [unit, decimals] = withdrawField.split(".");
		if (decimals && decimals.length > collateralAsset.decimals)
			return { withdrawError: "Too many decimals" };

		const withdraw = parseUnits(withdrawField, collateralAsset.decimals ?? 18);
		if (withdraw > balance) return { withdrawError: "Insufficient balance" };

		return { withdraw };
	}, [withdrawField, balance, collateralAsset.decimals]);

	const [leverageField, setLeverageField] = React.useState(
		Math.min(leverage, maxLeverage),
	);

	const [collateralYields] = useAssetYields(collateralAsset.address);

	const {
		targetBalance,
		resultLtv,
		targetCollateral,
		targetLoan,
		targetCollateralValue,
	} = usePositionDetails({
		market: position.market,
		balance,
		withdraw,
		leverage: leverageField,
	});

	const positionApy = usePositionApy(
		collateralValue,
		borrowAssets,
		collateralYields?.apy,
		market.state?.borrowApy,
	);

	const targetPositionApy = usePositionApy(
		targetCollateralValue,
		targetLoan,
		collateralYields?.apy,
		market.state?.borrowApy, // TODO: use targetBorrowApy
	);

	const hasInput = withdraw !== 0n || leverageField !== leverage;
	const errorMessage = !connected
		? "You must log in through the Safe App."
		: "";

	const [isPreparing, setIsPreparing] = React.useState(false);

	const getPositionTx = useGetPositionTx(position.market);

	return (
		<>
			<PositionSummary
				position={position}
				collateralYields={collateralYields}
			/>
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
									: collateralUsd != null
										? `$${(collateralUsd * withdraw.wadDiv(collateral).toWadFloat()).toFixed(2)}`
										: ""}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								onClick={() =>
									setWithdrawField(balance.format(collateralAsset.decimals))
								}
								sx={{ cursor: "pointer", textDecoration: "underline" }}
							>
								MAX: {balance.format(collateralAsset.decimals, 3)}
							</Typography>
						</Stack>
					}
					FormHelperTextProps={{ component: "div" }}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								<Token symbol={collateralAsset.symbol} size={20} />

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
				<Typography mt={2} gutterBottom>
					Leverage
				</Typography>
				<Stack direction="row" alignItems="center" pl={2} pr={2}>
					<LeverageField
						value={leverageField}
						setValue={setLeverageField}
						max={maxLeverage}
					/>
				</Stack>
			</Stack>
			<Divider />
			<Stack direction="row" justifyContent="space-between" padding={2}>
				<Stack alignItems="start">
					<Typography variant="body2">Balance</Typography>
					<Typography variant="body2">APY</Typography>
					<Typography variant="body2">LTV</Typography>
					<Typography variant="body2">Price tolerance</Typography>
				</Stack>
				<Stack alignItems="end">
					<Stack direction="row" alignItems="center">
						<Typography variant="body2" mr={0.8}>
							{balance.format(collateralAsset.decimals, 3)}
							{targetBalance != null &&
							targetBalance !== balance &&
							hasInput ? (
								<> ⇾ {targetBalance.format(collateralAsset.decimals, 3)} </>
							) : (
								""
							)}
						</Typography>
						<Token symbol={collateralAsset.symbol} size={16} />
					</Stack>
					{positionApy != null && (
						<Typography variant="body2">
							{(positionApy * 100).toFixed(2)}%
							{targetPositionApy != null && hasInput ? (
								<> ⇾ {(targetPositionApy * 100).toFixed(2)}%</>
							) : (
								""
							)}
						</Typography>
					)}
					<Typography variant="body2">
						{ltv.format(16, 2)}%
						{resultLtv != null && hasInput ? (
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
						{resultLtv != null && hasInput ? (
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
					startIcon={
						isPreparing ? (
							<CircularProgress color="inherit" size={16} />
						) : withdraw === balance ? (
							<CloseIcon />
						) : (
							<EditIcon />
						)
					}
					disableElevation
					onClick={async () => {
						if (targetCollateral == null || targetLoan == null) return;

						setIsPreparing(true);

						try {
							const tx = await getPositionTx(
								targetCollateral - collateral,
								borrowAssets - targetLoan,
								targetLoan === 0n ? borrowShares : undefined,
							);

							if (connected) {
								sdk.txs.send({
									txs: [{ ...tx, value: `0x${tx.value.toString(16)}` }],
								});
							} else {
								sendTransaction(tx);
							}
						} catch (error) {
							console.error(error);
						} finally {
							setIsPreparing(false);
						}
					}}
					disabled={!executor || !!withdrawError}
				>
					{withdraw === balance ? "Close" : "Adjust"}
				</Button>
			</Stack>
		</>
	);
};

export default React.memo(PositionContent);
