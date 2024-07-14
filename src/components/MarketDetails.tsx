import "evm-maths";

import Stack from "@mui/material/Stack";
import React from "react";
import MarketIcon from "./MarketIcon";
import type { MarketTitleProps } from "./MarketTitle";
import MarketTitle from "./MarketTitle";

const MarketDetails = (props: MarketTitleProps) => {
	return (
		<Stack
			direction="row"
			justifyContent="space-between"
			alignItems="center"
			padding={2}
		>
			<MarketIcon market={props.market} sx={{ marginRight: 1 }} />
			<MarketTitle variant="h5" {...props} />
		</Stack>
	);
};

export default React.memo(MarketDetails);
