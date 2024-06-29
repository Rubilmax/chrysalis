import React from "react";

import { yearInSeconds } from "@/yield";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const AccruingQuantity = ({
	quantity,
	ratePerSecond,
	precision = 3,
	decimals = 9,
}: {
	quantity: number;
	ratePerSecond: number;
	precision?: number;
	decimals?: number;
}) => {
	const [accruingQuantity, setAccruingQuantity] = React.useState(quantity);
	React.useEffect(() => {
		const delay = 2;
		const ratePerInterval = (1 + ratePerSecond) ** (delay / yearInSeconds);

		const interval = setInterval(() => {
			setAccruingQuantity(
				(accruingQuantity) => accruingQuantity * ratePerInterval,
			);
		}, delay * 1_000);

		return () => {
			clearInterval(interval);
		};
	}, [ratePerSecond]);

	const [accruingUnit, accruingDecimals] = accruingQuantity
		.toFixed(decimals)
		.split(".");
	const accruingPrecision = accruingDecimals?.slice(0, precision) ?? "";
	const accruingDust = accruingDecimals?.slice(precision) ?? "";

	return (
		<Stack display="inline-flex" direction="row" justifyContent="left">
			<span>{accruingUnit}</span>
			<span>.</span>
			<span>{accruingPrecision}</span>
			<Typography variant="inherit" color="text.disabled">
				{accruingDust}
			</Typography>
		</Stack>
	);
};

export default React.memo(AccruingQuantity);
