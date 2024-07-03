"use client";

import { ExecutorContext } from "@/app/providers/ExecutorContext";
import { executorDeployData } from "@/executor";
import { useLocalStorage } from "@/localStorage";
import { useDeployContract } from "@/wagmi";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import MenuIcon from "@mui/icons-material/Menu";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SettingsIcon from "@mui/icons-material/Settings";
import Alert from "@mui/material/Alert";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { ConnectKitButton } from "connectkit";
import Image from "next/image";
import React from "react";
import { useAccount } from "wagmi";
import ExecutorSelect from "./ExecutorSelect";
import PositionList from "./PositionList";

const NavBar = () => {
	const account = useAccount();

	const { addExecutor } = React.useContext(ExecutorContext);

	const [drawerOpen, setDrawerOpen] = useLocalStorage("drawer", false);
	const [settingsOpen, setSettingsOpen] = React.useState(false);

	React.useEffect(() => {
		if (!account.address) setDrawerOpen(false);
	}, [account.address, setDrawerOpen]);

	const {
		request: { deployContract, isPending },
		receipt,
	} = useDeployContract();

	const deployExecutor = React.useCallback(async () => {
		if (!account.address) return;

		deployContract({
			...executorDeployData,
			args: [account.address],
		});
	}, [deployContract, account.address]);

	React.useEffect(() => {
		if (!receipt.data?.contractAddress || !account.address) return;

		addExecutor({
			address: receipt.data.contractAddress,
			owner: account.address,
		});
	}, [receipt.data?.contractAddress, account.address, addExecutor]);

	const isDeploying =
		isPending || (receipt.isPending && receipt.fetchStatus !== "idle");

	return (
		<AppBar position="static" elevation={0} color="transparent">
			<Toolbar>
				<Link href="/">
					<Image src="/logo-light.svg" alt="Logo" width={32} height={32} />
				</Link>
				<Stack flex={1} />
				<ConnectKitButton theme="soft" showAvatar showBalance />
				{account.address && (
					<IconButton
						onClick={() => setDrawerOpen(true)}
						sx={{ marginLeft: 2 }}
					>
						<MenuIcon />
					</IconButton>
				)}

				<Slide in={drawerOpen} timeout={180} direction="left" mountOnEnter>
					<Paper
						elevation={1}
						sx={{
							position: "fixed",
							top: 0,
							right: 0,
							height: "100%",
							zIndex: 100,
						}}
					>
						<Stack
							position="relative"
							direction="row"
							justifyContent="space-between"
							alignItems="center"
							padding={2}
						>
							<ConnectKitButton theme="soft" showAvatar showBalance />
							<Stack
								direction="row"
								alignItems="center"
								spacing={0.5}
								marginLeft={2}
							>
								<IconButton onClick={() => setSettingsOpen(true)}>
									<SettingsIcon />
								</IconButton>
								<IconButton onClick={() => setDrawerOpen(false)}>
									<KeyboardDoubleArrowRightIcon />
								</IconButton>
							</Stack>
						</Stack>
						{account.address && (
							<Stack padding={2} marginTop={2}>
								<Typography variant="subtitle1" paragraph gutterBottom>
									Positions
								</Typography>
								<PositionList user={account.address} />
							</Stack>
						)}

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
										Chrysalis uses a contract called "Executor" to bundle
										operations and handle callbacks from Morpho Blue. This
										contract is <b>automatically deployed, set up, and saved</b>{" "}
										locally in your browser the first time you submit a
										transaction using Chrysalis.
									</Typography>
									<Typography variant="body2" paragraph>
										You can also{" "}
										<b>manually trigger the deployment and set up</b>, or save &
										use another <b>previously deployed Executor contract</b>.
									</Typography>
								</Alert>
								<Stack>
									<ExecutorSelect disabled={isDeploying} />
									<Divider>
										<Typography variant="subtitle1" fontWeight={700}>
											OR
										</Typography>
									</Divider>
									<Button
										variant="contained"
										endIcon={
											isDeploying ? (
												<CircularProgress color="inherit" size={16} />
											) : (
												<RocketLaunchIcon />
											)
										}
										disabled={!account.address || isDeploying}
										onClick={deployExecutor}
										sx={{ mt: 2 }}
									>
										Deploy new
									</Button>
								</Stack>
							</DialogContent>
						</Dialog>
					</Paper>
				</Slide>
				{/* <SwipeableDrawer
					open={drawerOpen}
					onOpen={() => setDrawerOpen(true)}
					onClose={() => setDrawerOpen(false)}
					anchor="right"
					elevation={1}
					hideBackdrop
				></SwipeableDrawer> */}
			</Toolbar>
		</AppBar>
	);
};

export default React.memo(NavBar);
