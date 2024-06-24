import { executorDeployData } from "@/executor";
import { useDeployContract } from "@/wagmi";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import Toolbar from "@mui/material/Toolbar";
import { ConnectKitButton } from "connectkit";
import React from "react";
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
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { useAccount } from "wagmi";
import ExecutorSelect from "./ExecutorSelect";

const NavBar = () => {
	const account = useAccount();

	const { addExecutor } = React.useContext(ExecutorContext);

	const [settingsOpen, setSettingsOpen] = React.useState(false);

	const {
		request: { deployContract },
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
						<Stack>
							<ExecutorSelect />
							<Divider>
								<Typography variant="subtitle1" fontWeight={700}>
									OR
								</Typography>
							</Divider>
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
								onClick={deployExecutor}
								sx={{ mt: 2 }}
							>
								Deploy new
							</Button>
						</Stack>
					</DialogContent>
				</Dialog>
			</Toolbar>
		</AppBar>
	);
};

export default React.memo(NavBar);
