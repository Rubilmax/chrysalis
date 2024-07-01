import Stack from "@mui/material/Stack";
import type React from "react";

export default function Layout({ children }: React.PropsWithChildren) {
	return (
		<Stack
			direction="row"
			justifyContent="center"
			alignItems="center"
			minHeight={500}
			mt={4}
		>
			{children}
		</Stack>
	);
}
