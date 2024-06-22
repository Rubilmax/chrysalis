import { ExecutorContext } from "@/app/providers/ExecutorContext";
import { useEthersProvider } from "@/ethers";
import { useDeployContract } from "@/wagmi";
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
import { useSendTransaction } from "@/wagmi";
import { ExecutorEncoder } from "executooor";
import React from "react";
import { type Hex, maxUint256, parseUnits, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import type { Position } from "./PositionCard";

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
		() => collateral.mulDivDown(market.collateralPrice, parseUnits("1", 36)),
		[collateral, market.collateralPrice],
	);

	const balance = React.useMemo(
		() =>
			(collateralValue - borrowAssets).mulDivDown(
				parseUnits("1", 36),
				market.collateralPrice,
			),
		[borrowAssets, market.collateralPrice, collateralValue],
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
		if (decimals && decimals.length > market.collateralAsset.decimals)
			return { withdrawError: "Too many decimals" };

		const withdraw = parseUnits(
			withdrawField,
			market.collateralAsset.decimals ?? 18,
		);
		if (withdraw > balance) return { withdrawError: "Insufficient balance" };

		return { withdraw };
	}, [withdrawField, balance, market.collateralAsset.decimals]);

	const [leverageField, setLeverageField] = React.useState(
		Math.min(leverage, maxLeverage),
	);

	const targetLtv = React.useMemo(
		() =>
			BigInt.WAD -
			BigInt.WAD.wadDivUp(parseUnits(leverageField.toFixed(18), 18)),
		[leverageField],
	);

	const targetCollateral = React.useMemo(() => {
		if (withdraw == null) return;

		return (balance - withdraw).wadDivDown(BigInt.WAD - targetLtv);
	}, [balance, withdraw, targetLtv]);
	const targetLoan = React.useMemo(() => {
		if (targetCollateral == null) return;
		if (targetCollateral === 0n) return 0n;

		return targetLtv.wadMulDown(
			targetCollateral.mulDivDown(market.collateralPrice, parseUnits("1", 36)),
		);
	}, [market.collateralPrice, targetCollateral, targetLtv]);

	const resultLtv = React.useMemo(() => {
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
						if (!account.address) return;
						if (!executor) return;

						const encoder = new ExecutorEncoder(executor.address, provider);

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
									account.address,
									[],
								)
								.morphoBlueWithdrawCollateral(
									market.morphoBlue.address,
									marketParams,
									collateral,
									account.address,
									account.address,
								)
								.populateExec();

							console.log({ to: executor, value, data: data as Hex });

							sendTransaction({
								to: executor.address,
								value,
								data: data as Hex,
							});
						}
					}}
					disabled={!executor || !connected || !!withdrawError}
				>
					{withdraw === balance ? "Close" : "Adjust"}
				</Button>
			</Stack>
		</>
	);
};

export default React.memo(PositionContent);
