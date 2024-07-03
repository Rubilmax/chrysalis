"use client";

import { createTheme } from "@mui/material/styles";
import { Poppins } from "next/font/google";
import Link, { type LinkProps } from "next/link";
import React from "react";

const poppins = Poppins({
	weight: ["300", "400", "500", "600", "700"],
	subsets: ["latin"],
	display: "swap",
	preload: true,
});

const theme = createTheme({
	typography: {
		fontFamily: poppins.style.fontFamily,
		h1: {
			fontSize: "3.5rem",
			fontWeight: 700,
		},
		h2: {
			fontSize: "3rem",
			fontWeight: 700,
		},
		h3: {
			fontSize: "2.5rem",
			fontWeight: 600,
		},
		h4: {
			fontSize: "2rem",
			fontWeight: 600,
		},
		h5: {
			fontSize: "1.75rem",
			fontWeight: 500,
		},
		h6: {
			fontSize: "1.5rem",
			fontWeight: 500,
		},
		subtitle1: {
			fontSize: "1rem",
			fontWeight: 500,
		},
		subtitle2: {
			fontSize: "0.9rem",
			fontWeight: 500,
		},
		body1: {
			fontSize: "1rem",
			fontWeight: 400,
		},
		body2: {
			fontSize: "0.85rem",
			fontWeight: 400,
		},
	},
	palette: {
		primary: {
			main: "#2470FF",
		},
		secondary: {
			main: "#5792FF",
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
		MuiAppBar: {
			styleOverrides: {
				root: {
					padding: 10,
				},
			},
		},
		MuiPaper: {
			variants: [
				{
					props: {
						variant: "transparent",
					},
					style: {
						background: "rgba(255, 255, 255, 0.98)",
					},
				},
			],
		},
		MuiLink: {
			defaultProps: {
				component: React.forwardRef<HTMLAnchorElement, LinkProps>(
					(props, ref) => <Link ref={ref} {...props} />,
				),
			},
			styleOverrides: {
				root: {
					color: "inherit",
					textDecoration: "none",
				},
			},
		},
		MuiLinearProgress: {
			styleOverrides: {
				bar1Determinate: {
					transition: "transform 150ms ease",
				},
			},
		},
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
		MuiTextField: {
			variants: [
				{
					props: { size: "large" },
					style: {
						"& label": {
							fontSize: "1.1rem",
						},
						"& input": {
							height: "2em",
							fontSize: "2rem",
							textOverflow: "ellipsis",
						},
					},
				},
			],
		},
		MuiFilledInput: {
			styleOverrides: {
				root: {
					backgroundColor: "#F9F9F9",
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

declare module "@mui/material/Paper" {
	interface PaperPropsVariantOverrides {
		transparent: true;
	}
}

declare module "@mui/material/TextField" {
	interface TextFieldPropsSizeOverrides {
		large: true;
	}
}

export default theme;
