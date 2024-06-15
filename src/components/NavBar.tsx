"use client";

import Toolbar from "@mui/material/Toolbar";
import { ConnectKitButton } from "connectkit";
import React, { memo, useContext } from "react";
import "evm-maths";
import { ExecutorContext } from "@/app/providers";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha, styled } from "@mui/material/styles";
import Image from "next/image";

const Search = styled("div")(({ theme }) => ({
	position: "relative",
	borderRadius: theme.shape.borderRadius,
	backgroundColor: alpha(theme.palette.common.white, 0.15),
	"&:hover": {
		backgroundColor: alpha(theme.palette.common.white, 0.25),
	},
	marginRight: theme.spacing(2),
	marginLeft: 0,
	width: "100%",
	[theme.breakpoints.up("sm")]: {
		marginLeft: theme.spacing(3),
		width: "auto",
	},
}));

const NavBar = () => {
	const { executor, setExecutor, isValid } = useContext(ExecutorContext);

	const invalidExecutor = executor != null && !isValid;

	return (
		<AppBar position="static" elevation={0} color="secondary">
			<Toolbar>
				<Image
					src="./chrysalis.png"
					alt="Logo"
					width={26}
					height={40}
					style={{ marginRight: "1rem" }}
				/>
				<Typography
					variant="h6"
					noWrap
					sx={{
						mr: 2,
						display: { xs: "none", md: "flex" },
						fontFamily: "monospace",
						fontWeight: 700,
						letterSpacing: ".3rem",
						color: "inherit",
						textDecoration: "none",
					}}
				>
					CHRYSALIS
				</Typography>
				<Box flexGrow="1" />
				<Search>
					<TextField
						value={executor ?? ""}
						placeholder="Executor address"
						onChange={(event) => setExecutor(event.target.value)}
						error={invalidExecutor}
						helperText={invalidExecutor ? "Invalid address" : ""}
						size="small"
						variant="outlined"
						label="Executor address"
						style={{ width: "26rem" }}
						disabled={executor == null}
					/>
				</Search>
				<Box flexGrow="1" />
				<ConnectKitButton theme="soft" showAvatar showBalance />
			</Toolbar>
		</AppBar>
	);
};

export default memo(NavBar);
