import { ExecutorContext } from "@/app/providers/ExecutorContext";
import { useEthersProvider } from "@/ethers";
import { parseNumber } from "@/format";
import { type BestSwapParams, fetchBestSwap } from "@/swap";
import { useDeployContract } from "@/wagmi";
import { useSendTransaction } from "@/wagmi";
import { useAssetApys, usePositionApy } from "@/yield";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { ExecutorEncoder } from "executooor";
import React from "react";
import { maxUint256, parseUnits, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import type { Position } from "./PositionPage";
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
	const provider = useEthersProvider();
	const { executor } = React.useContext(ExecutorContext);

	const account = useAccount();
	const { connected } = useSafeAppsSDK();

	const collateralValue = React.useMemo(
		() => collateral.mulDivDown(collateralPrice, parseUnits("1", 36)),
		[collateral, collateralPrice],
	);

	const [collateralApys] = useAssetApys(collateralAsset.address);

	const balance = React.useMemo(
		() =>
			(collateralValue - borrowAssets).mulDivDown(
				parseUnits("1", 36),
				collateralPrice,
			),
		[borrowAssets, collateralPrice, collateralValue],
	);

	const ltv = React.useMemo(() => {
		if (collateralValue === 0n) return maxUint256;

		return borrowAssets.wadDiv(collateralValue);
	}, [borrowAssets, collateralValue]);

	const leverage = React.useMemo(() => {
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

	const targetLtv = React.useMemo(
		() => BigInt.WAD - BigInt.WAD.wadDivUp(parseNumber(leverageField)),
		[leverageField],
	);

	const targetCollateral = React.useMemo(() => {
		if (withdraw == null) return;
		if (targetLtv === 0n) return balance - withdraw;

		return (balance - withdraw).wadDivDown(BigInt.WAD - targetLtv);
	}, [balance, withdraw, targetLtv]);
	const targetLoan = React.useMemo(() => {
		if (targetCollateral == null) return;
		if (targetCollateral === 0n) return 0n;

		return targetLtv.wadMulDown(
			targetCollateral.mulDivDown(collateralPrice, parseUnits("1", 36)),
		);
	}, [collateralPrice, targetCollateral, targetLtv]);

	const targetCollateralValue = React.useMemo(
		() => targetCollateral?.mulDivDown(collateralPrice, parseUnits("1", 36)),
		[targetCollateral, collateralPrice],
	);

	const resultLtv = React.useMemo(() => {
		if (targetCollateralValue == null || targetLoan == null) return;
		if (targetCollateralValue === 0n) return 0n;

		return targetLoan.wadDiv(targetCollateralValue);
	}, [targetLoan, targetCollateralValue]);

	const targetBalance = React.useMemo(() => {
		if (targetCollateralValue == null || targetLoan == null) return;

		return (targetCollateralValue - targetLoan).mulDivDown(
			parseUnits("1", 36),
			collateralPrice,
		);
	}, [targetLoan, collateralPrice, targetCollateralValue]);

	const positionApy = usePositionApy(
		collateralValue,
		borrowAssets,
		collateralApys.apy,
		market.state?.borrowApy,
	);

	const targetPositionApy = usePositionApy(
		targetCollateralValue,
		targetLoan,
		collateralApys.apy,
		market.state?.borrowApy, // TODO: use targetBorrowApy
	);

	const hasInput = withdraw !== 0n || leverageField !== leverage;
	const errorMessage = !connected
		? "You must log in through the Safe App."
		: "";

	const [isPreparing, setIsPreparing] = React.useState(false);

	return (
		<>
			<PositionSummary
				position={position}
				positionApy={positionApy}
				collateralApys={collateralApys}
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
						setIsPreparing(true);

						try {
							if (
								!account.address ||
								account.chainId == null ||
								targetCollateral == null ||
								targetLoan == null
							)
								return;
							if (!executor) return;

							const marketParams = {
								collateralToken: collateralAsset.address,
								loanToken: loanAsset.address,
								irm: market.irmAddress,
								oracle: market.oracleAddress,
								lltv: market.lltv,
							};

							const suppliedCollateral = targetCollateral - collateral;
							const borrowedAssets = targetLoan - borrowAssets;

							const encoder = new ExecutorEncoder(executor.address, provider);

							if (suppliedCollateral < 0n)
								encoder.morphoBlueWithdrawCollateral(
									market.morphoBlue.address,
									marketParams,
									-suppliedCollateral,
									account.address,
									account.address,
								);

							if (borrowedAssets > 0n)
								encoder.morphoBlueBorrow(
									market.morphoBlue.address,
									marketParams,
									borrowedAssets,
									0n,
									account.address,
									account.address,
								);

							let params: BestSwapParams | null = null;
							if (borrowedAssets < 0n && suppliedCollateral < 0n) {
								params = {
									chainId: account.chainId,
									src: collateralAsset.address,
									dst: loanAsset.address,
									from: account.address,
									amount: -suppliedCollateral,
									slippage: 0.005,
								};
							} else if (borrowedAssets > 0n && suppliedCollateral > 0n) {
								params = {
									chainId: account.chainId,
									src: loanAsset.address,
									dst: collateralAsset.address,
									from: account.address,
									amount: borrowedAssets,
									slippage: 0.005,
								};
							}

							if (params != null) {
								const swap = await fetchBestSwap(params);

								if (swap.spender)
									// TODO: check if allowance sufficient.
									encoder.erc20Approve(params.src, swap.spender, params.amount);

								console.log(swap);

								encoder.pushCall(swap.tx.to, swap.tx.value, swap.tx.data);
							}

							if (suppliedCollateral > 0n)
								encoder.morphoBlueSupplyCollateral(
									market.morphoBlue.address,
									marketParams,
									suppliedCollateral,
									account.address,
									encoder.flush(),
								);

							if (borrowedAssets < 0n) {
								if (targetLoan === 0n)
									encoder.morphoBlueRepay(
										market.morphoBlue.address,
										marketParams,
										0n,
										borrowShares,
										account.address,
										encoder.flush(),
									);
								else
									encoder.morphoBlueRepay(
										market.morphoBlue.address,
										marketParams,
										-borrowedAssets,
										0n,
										account.address,
										encoder.flush(),
									);
							}

							if (connected) {
							} else {
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
