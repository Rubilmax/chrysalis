import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import Toolbar from "@mui/material/Toolbar";
import { ConnectKitButton } from "connectkit";
import React from "react";
import "evm-maths";
import {
	ExecutorContext,
	ExecutorDetails,
} from "@/app/providers/ExecutorContext";
import { useAddressOrEnsInput } from "@/input";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import WarningIcon from "@mui/icons-material/Warning";
import Alert from "@mui/material/Alert";
import AppBar from "@mui/material/AppBar";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { getAddress } from "viem";
import { useAccount, useBytecode } from "wagmi";
import DataLink from "./DataLink";

enum ExecutorOptionGroup {
	ACCOUNT = "My Executors",
	SAVED = "Saved Executors",
}

interface ExecutorOption extends ExecutorDetails {
	isAdd?: boolean;
	group?: ExecutorOptionGroup;
}

const filter = createFilterOptions<ExecutorOption>();

const NavBar = () => {
	const account = useAccount();

	const {
		executors,
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
		setInput,
		isLoadingAddress,
		isLoadingEns,
	} = useAddressOrEnsInput(selectedExecutor?.address);

	const { data: bytecode, isLoading: isBytecodeLoading } = useBytecode({
		address,
	});

	const inputExecutor = React.useMemo(() => {
		if (!address || !bytecode) return;

		// TODO: check bytecode

		return {
			address,
			owner: getAddress(`0x${bytecode.substring(bytecode.length - 40)}`),
		};
	}, [address, bytecode]);

	const loading = isLoadingAddress || isLoadingEns || isBytecodeLoading;
	const error = !loading && !inputExecutor && input !== "";
	const warning =
		!!selectedExecutor && selectedExecutor.owner !== account.address;

	const options: ExecutorOption[] = React.useMemo(
		() =>
			Object.values(executors).map((executor) => ({
				...executor,
				isAdd: false,
				group:
					executor.address === account.address
						? ExecutorOptionGroup.ACCOUNT
						: ExecutorOptionGroup.SAVED,
			})),
		[executors],
	);

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
							<Autocomplete<ExecutorOption, false, false, true>
								inputValue={input}
								onInputChange={(event, value) => setInput(value)}
								value={selectedExecutor ?? null}
								onChange={(event, value) => {
									if (typeof value === "string") return;

									if (!value) return setSelectedExecutor(undefined);

									const { address, owner } = value;

									addExecutor({ address, owner });
									setSelectedExecutor(address);
								}}
								options={options}
								filterOptions={(options, params) => {
									const filteredExecutors = filter(options, params);

									if (
										params.inputValue !== "" &&
										filteredExecutors.length === 0 &&
										inputExecutor
									)
										return [
											{
												...inputExecutor,
												isAdd: true,
											},
										];

									return filteredExecutors;
								}}
								noOptionsText="No saved Executor found"
								loading={loading}
								disabled={status === "pending"}
								autoSelect
								autoHighlight
								handleHomeEndKeys
								sx={{ width: 520 }}
								getOptionLabel={(option) => {
									if (typeof option === "string") return option;

									return option.address;
								}}
								isOptionEqualToValue={(option, value) =>
									option.address === value.address
								}
								groupBy={({ group }) => group ?? ExecutorOptionGroup.ACCOUNT}
								renderOption={(props, { address, owner, isAdd }) => {
									console.log(address, owner, isAdd);
									return (
										<Stack
											component="li"
											{...props}
											key={address + isAdd}
											direction="row"
											justifyContent="space-between"
										>
											<Stack flex={1}>
												<Typography variant="subtitle2">{address}</Typography>
												<Stack direction="row" alignItems="center">
													<Chip size="small" label="Owner" />
													<Typography variant="caption" ml={1}>
														{owner}
													</Typography>
												</Stack>
											</Stack>
											{isAdd && <PersonAddIcon />}
										</Stack>
									);
								}}
								renderInput={(params) => (
									<TextField
										{...params}
										placeholder="0x{...} or {...}.eth"
										error={error}
										helperText={
											<Stack direction="row" justifyContent="space-between">
												<Typography variant="caption">
													{error
														? !address
															? "Invalid address or ENS"
															: "Not an Executor contract"
														: parsedAddress
															? ens
															: address}
												</Typography>
												{selectedExecutor && (
													<Tooltip
														title={
															warning
																? "You are not the owner of this Executor."
																: undefined
														}
														placement="top"
													>
														<Typography
															variant="caption"
															sx={({ palette }) => ({
																color: warning
																	? palette.warning.main
																	: "inherit",
															})}
														>
															{warning && (
																<WarningIcon
																	fontSize="inherit"
																	sx={{ mr: 0.6 }}
																/>
															)}
															Owner:{" "}
															<DataLink
																data={selectedExecutor.owner}
																type="address"
															/>
														</Typography>
													</Tooltip>
												)}
											</Stack>
										}
										FormHelperTextProps={{ component: "div" }}
										size="small"
										variant="outlined"
										label="Executor contract"
									/>
								)}
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
