import {
	ExecutorContext,
	type ExecutorDetails,
} from "@/app/providers/ExecutorContext";
import { getExecutorOwner } from "@/executor";
import { useAddressOrEnsInput } from "@/input";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import WarningIcon from "@mui/icons-material/Warning";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React from "react";
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

const ExecutorSelect = () => {
	const account = useAccount();

	const {
		executor,
		executors,
		setSelectedExecutor,
		addExecutor,
		removeExecutor,
	} = React.useContext(ExecutorContext);

	const {
		address,
		parsedAddress,
		ens,
		parsedEns,
		input,
		setInput,
		isLoadingAddress,
		isLoadingEns,
	} = useAddressOrEnsInput(executor?.address);

	const { data: bytecode, isLoading: isBytecodeLoading } = useBytecode({
		address,
	});

	const inputExecutor = React.useMemo(() => {
		if (!address || !bytecode) return;

		const owner = getExecutorOwner(bytecode);
		if (owner == null) return;

		return {
			address,
			owner,
		};
	}, [address, bytecode]);

	const loading = isLoadingAddress || isLoadingEns || isBytecodeLoading;

	const error = !loading && !inputExecutor && input !== "";
	const warning = !!executor && executor.owner !== account.address;

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
		[executors, account.address],
	);

	return (
		<Autocomplete<ExecutorOption, false, false, true>
			inputValue={input}
			onInputChange={(event, value) => setInput(value)}
			value={executor ?? null}
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
			noOptionsText={
				error
					? !address
						? "Invalid address or ENS"
						: "Not an Executor contract"
					: "No saved Executor found"
			}
			loading={loading}
			disabled={status === "pending"}
			autoSelect
			autoHighlight
			handleHomeEndKeys
			getOptionLabel={(option) => {
				if (typeof option === "string") return option;

				return option.address;
			}}
			isOptionEqualToValue={(option, value) => option.address === value.address}
			groupBy={({ group }) => group ?? ExecutorOptionGroup.ACCOUNT}
			renderOption={(props, { address, owner, isAdd, group }) => {
				return (
					<Stack
						component="li"
						{...props}
						key={address + owner + isAdd + group}
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
						{isAdd ? (
							<PersonAddIcon sx={{ mr: 1 }} />
						) : (
							<IconButton
								onClick={(event) => {
									event.stopPropagation();

									if (executor?.address === address) setInput("");
									removeExecutor(address);
								}}
							>
								<DeleteIcon />
							</IconButton>
						)}
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
							{(parsedAddress || parsedEns) && (
								<Typography variant="caption">
									{parsedAddress ? ens : address}
								</Typography>
							)}
							{executor && (
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
											color: warning ? palette.warning.main : "inherit",
										})}
									>
										{warning && (
											<WarningIcon fontSize="inherit" sx={{ mr: 0.6 }} />
										)}
										Owner: <DataLink data={executor.owner} type="address" />
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
	);
};

export default React.memo(ExecutorSelect);
