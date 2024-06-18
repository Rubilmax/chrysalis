"use client";

import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import Toolbar from "@mui/material/Toolbar";
import { ConnectKitButton } from "connectkit";
import React, { memo, useContext, useState } from "react";
import "evm-maths";
import { ExecutorContext } from "@/app/providers/ExecutorContext";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import Alert from "@mui/material/Alert";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { useAccount } from "wagmi";

const NavBar = () => {
	const account = useAccount();
	const { executor, setExecutor, deployExecutor, status, isValid } =
		useContext(ExecutorContext);

	const invalidExecutor = executor != null && !isValid;

	const [settingsOpen, setSettingsOpen] = useState(false);

	return (
		<AppBar position="static" elevation={0} color="secondary">
			<Toolbar>
				<Image
					src="./chrysalis.png"
					alt="Logo"
					width={40}
					height={40}
					style={{ marginRight: "1rem" }}
				/>
				<Typography
					variant="h6"
					noWrap
					sx={{
						display: { xs: "none", md: "flex" },
						fontFamily: "monospace",
						fontWeight: 700,
						letterSpacing: ".2rem",
					}}
				>
					CHRYSALIS
				</Typography>
				<Box flexGrow="1" />
				<ConnectKitButton theme="soft" showAvatar showBalance />
				<IconButton
					onClick={() => setSettingsOpen(true)}
					sx={{ marginLeft: 2 }}
				>
					<SettingsIcon />
				</IconButton>
				<Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
					>
						<DialogTitle>Settings</DialogTitle>
						<IconButton
							aria-label="close"
							onClick={() => setSettingsOpen(false)}
							sx={{ marginRight: 1 }}
						>
							<CloseIcon />
						</IconButton>
					</Stack>
					<DialogContent dividers>
						<Alert severity="info" sx={{ marginBottom: 3 }}>
							<Typography variant="body2" paragraph>
								Chrysalis uses a contract called "Executor" to bundle operations
								and handle callbacks from Morpho Blue. This contract is{" "}
								<b>automatically deployed, set up, and saved</b> locally in your
								browser the first time you submit a transaction using Chrysalis.
							</Typography>
							<Typography variant="body2" paragraph>
								You can also <b>manually trigger the deployment and set up</b>,
								or save & use another{" "}
								<b>previously deployed Executor contract</b>.
							</Typography>
						</Alert>
						<Stack
							direction="row"
							justifyContent="space-between"
							alignItems="flex-start"
						>
							<TextField
								value={executor ?? ""}
								placeholder="0x..."
								onChange={(event) => setExecutor(event.target.value)}
								error={invalidExecutor}
								helperText={invalidExecutor ? "Invalid address" : ""}
								size="small"
								variant="outlined"
								label="Executor"
								style={{ width: "26rem" }}
								disabled={executor == null || status === "pending"}
							/>
							<Button
								variant="contained"
								endIcon={
									status === "pending" ? (
										<CircularProgress color="inherit" size={16} />
									) : (
										<RocketLaunchIcon />
									)
								}
								disabled={!account.address || status === "pending"}
								onClick={() => deployExecutor(account.address!)}
							>
								Deploy
							</Button>
						</Stack>
					</DialogContent>
				</Dialog>
			</Toolbar>
		</AppBar>
	);
};

export default memo(NavBar);
