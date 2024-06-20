import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import Toolbar from "@mui/material/Toolbar";
import { ConnectKitButton } from "connectkit";
import React from "react";
import "evm-maths";
import { ExecutorContext } from "@/app/providers/ExecutorContext";
import { useAddressOrEnsInput } from "@/input";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
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
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { useAccount, useBytecode, useReadContract } from "wagmi";

const NavBar = () => {
	const account = useAccount();

	const {
		selectedExecutor,
		setSelectedExecutor,
		deployExecutor,
		addExecutor,
		status,
	} = React.useContext(ExecutorContext);

	const {
		address,
		parsedAddress,
		ens,
		input,
		debouncedInput,
		setInput,
		isLoadingAddress,
		isLoadingEns,
	} = useAddressOrEnsInput(selectedExecutor?.address);

	const [isTouched, setIsTouched] = React.useState(false);

	const isValid = !isLoadingAddress && !isLoadingEns && !!address;

	const { data: bytecode, isLoading: isBytecodeLoading } = useBytecode({
		address,
	});

	const [settingsOpen, setSettingsOpen] = React.useState(false);

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
				<Dialog
					maxWidth="md"
					open={settingsOpen}
					onClose={() => setSettingsOpen(false)}
				>
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
								value={input}
								placeholder="0x{...} or {...}.eth"
								onChange={(event) => {
									setInput(event.target.value);
									setIsTouched(true);
								}}
								error={!isValid && isTouched}
								helperText={
									(!isValid && isTouched && "Invalid address or ENS") ||
									parsedAddress
										? ens
										: address
								}
								size="small"
								variant="outlined"
								label="Executor contract"
								style={{ width: "30rem" }}
								disabled={status === "pending"}
								InputProps={{
									endAdornment: (
										<InputAdornment position="end">
											{isBytecodeLoading ? (
												<CircularProgress color="inherit" size={16} />
											) : (
												bytecode && (
													<Button
														color="inherit"
														size="small"
														startIcon={<PersonAddIcon />}
														onClick={() => {
															if (!address) return;

															addExecutor({
																address,
																owner: `0x${bytecode.substring(bytecode.length - 40)}`,
															});
														}}
													>
														Add
													</Button>
												)
											)}
										</InputAdornment>
									),
								}}
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
								onClick={() => deployExecutor()}
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

export default React.memo(NavBar);
