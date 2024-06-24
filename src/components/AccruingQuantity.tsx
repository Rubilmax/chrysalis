import React from "react";

import "@layflags/rolling-number";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";

declare global {
	namespace JSX {
		interface IntrinsicElements {
			"layflags-rolling-number": RollingNumberAttributes;
		}

		interface RollingNumberAttributes
			extends React.HTMLAttributes<HTMLSpanElement> {
			name: string;
		}
	}
}

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
	const theme = useTheme();

	const [accruingQuantity, setAccruingQuantity] = React.useState(quantity);
	React.useEffect(() => {
		const delay = 2;
		const ratePerInterval =
			(1 + ratePerSecond) ** (delay / (365.25 * 24 * 60 * 60));

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
		<Stack direction="row" justifyContent="left">
			<layflags-rolling-number
				style={{
					// @ts-ignore
					"--roll-duration": "400ms",
				}}
				value={accruingUnit}
			/>
			<span>.</span>
			<layflags-rolling-number
				style={{
					// @ts-ignore
					"--roll-duration": "400ms",
				}}
				value={accruingPrecision}
			/>
			<layflags-rolling-number
				style={{
					// @ts-ignore
					"--roll-duration": "400ms",
					color: theme.palette.text.disabled,
					fontWeight: 100,
				}}
				value={accruingDust}
			/>
		</Stack>
	);
};

export default React.memo(AccruingQuantity);
