"use client";

import { createTheme } from "@mui/material/styles";
import { Poppins } from "next/font/google";

const poppins = Poppins({
	weight: ["300", "400", "500", "700"],
	subsets: ["latin"],
	display: "swap",
	preload: true,
});

const theme = createTheme({
	typography: {
		fontFamily: poppins.style.fontFamily,
	},
	palette: {
		primary: {
			main: "#06573a",
		},
		secondary: {
			main: "#f3e2c8",
		},
		success: {
			main: "#0a7952",
		},
		error: {
			main: "#8b0000",
		},
		warning: {
			main: "#b8860b",
		},
		info: {
			main: "#121212",
		},
	},
	components: {
		MuiChip: {
			styleOverrides: {
				root: {
					borderRadius: 6,
				},
			},
		},
		MuiSvgIcon: {
			styleOverrides: {
				root: {
					verticalAlign: "middle",
				},
			},
		},
		MuiTooltip: {
			styleOverrides: {
				tooltipPlacementTop: {
					marginBottom: "4px !important",
				},
				tooltipPlacementBottom: {
					marginTop: "4px !important",
				},
				tooltipPlacementRight: {
					marginLeft: "4px !important",
				},
				tooltipPlacementLeft: {
					marginRight: "4px !important",
				},
			},
		},
		MuiSnackbar: {
			styleOverrides: {
				root: {
					position: "relative",
					marginTop: 10,
				},
			},
		},
		MuiSnackbarContent: {
			styleOverrides: {
				root: {
					padding: 0,
					backgroundColor: "transparent",
					boxShadow: "none",
				},
				message: {
					width: "100%",
					padding: 0,
				},
			},
		},
	},
});

export default theme;
