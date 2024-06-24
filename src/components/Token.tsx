import { Typography } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import React from "react";

const Token = ({
	symbol,
	size = 32,
}: {
	symbol: string;
	size?: number;
}) => {
	return (
		<Stack direction="row" alignItems="center">
			<Avatar
				src={`https://cdn.morpho.org/assets/logos/${symbol.toLowerCase()}.svg`}
				sx={{ width: size, height: size, marginRight: "0.3rem" }}
			/>
			<Typography variant="body2" fontSize={Math.ceil((size * 2) / 3)}>
				{symbol}
			</Typography>
		</Stack>
	);
};

export default React.memo(Token);
