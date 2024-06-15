"use client";

import React, { memo, useContext, useMemo } from "react";
import { Hex, parseUnits, zeroAddress } from "viem";
import "evm-maths";
import { ExecutorContext } from "@/app/providers";
import { useEthersProvider } from "@/ethers";
import { GetUserMarketPositionsQuery } from "@/graphql/GetMarketPositions.query.generated";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { ExecutorEncoder } from "executooor";
import { useAccount, useSendTransaction } from "wagmi";

const Position = ({
	position,
}: {
	position: GetUserMarketPositionsQuery["userByAddress"]["marketPositions"][number];
}) => {
	const collateralValue = useMemo(() => {
		if (position.market.collateralPrice == null) return null;

		return position.collateral.mulDivDown(
			position.market.collateralPrice,
			parseUnits("1", 36),
		);
	}, [position]);

	const ltv = useMemo(() => {
		if (collateralValue == null) return "∞";

		return position.borrowAssets.wadDiv(collateralValue).format(16, 3);
	}, [position]);

	const leverage = useMemo(() => {
		if (collateralValue == null) return "∞";

		return collateralValue
			.wadDiv(collateralValue - position.borrowAssets)
			.formatWad(2);
	}, [position]);

	const borrowApy = position.market.dailyApys?.borrowApy;

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
				<Typography>
					Collateral:{" "}
					{position.collateral.format(
						position.market.collateralAsset?.decimals,
						3,
					)}{" "}
					($
					{position.collateralUsd?.toFixed(2)})
				</Typography>
				<Typography>
					Borrow:{" "}
					{position.borrowAssets.format(position.market.loanAsset.decimals, 3)}{" "}
					($
					{position.borrowAssetsUsd?.toFixed(2)})
				</Typography>
				<Typography>LTV: {ltv}%</Typography>
				<Typography>Leverage: {leverage}</Typography>
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
