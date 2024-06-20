"use client";

import { createTheme } from "@mui/material/styles";
import { Roboto } from "next/font/google";

const roboto = Roboto({
	weight: ["300", "400", "500", "700"],
	subsets: ["latin"],
	display: "swap",
});

const theme = createTheme({
	typography: {
		fontFamily: roboto.style.fontFamily,
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
});

export default theme;
