import { useLocalStorage } from "@/localStorage";
import React from "react";
import {
	type Address,
	type Hash,
	type TransactionRequest,
	isAddress,
} from "viem";

export interface ExecutorDetails {
	address: Address;
	owner: Address;
}

export const ExecutorContext = React.createContext<{
	executor?: ExecutorDetails;
	executors: Record<Address, ExecutorDetails>;
	setSelectedExecutor: React.Dispatch<
		React.SetStateAction<Address | undefined>
	>;
	addExecutor: (address: ExecutorDetails) => void;
	removeExecutor: (address: Address) => void;
}>({
	executor: undefined,
	executors: {},
	setSelectedExecutor: () => {},
	addExecutor: () => {},
	removeExecutor: () => {},
});

export const ExecutorContextProvider = ({
	children,
}: { children: React.ReactNode }) => {
	const [txBatch, setTxBatch] = React.useState<TransactionRequest[]>([]);

	const [selectedExecutorAddress, setSelectedExecutor] =
		useLocalStorage<Address>("selectedExecutor");
	const [executors, setExecutors] = useLocalStorage<
		Record<Address, ExecutorDetails>
	>("executors", {});

	const addExecutor = React.useCallback(
		(executor: ExecutorDetails) => {
			if (!isAddress(executor.address)) return;

			setExecutors((executors) => ({
				...executors,
				[executor.address]: executor,
			}));
		},
		[setExecutors],
	);

	const removeExecutor = React.useCallback(
		(executor: Address) => {
			if (!isAddress(executor)) return;

			setExecutors((executors) => {
				delete executors[executor];

				return { ...executors };
			});
		},
		[setExecutors],
	);

	const executor = React.useMemo(
		() =>
			selectedExecutorAddress ? executors[selectedExecutorAddress] : undefined,
		[selectedExecutorAddress, executors],
	);

	return (
		<ExecutorContext.Provider
			value={{
				executor,
				executors,
				setSelectedExecutor,
				addExecutor,
				removeExecutor,
			}}
		>
			{children}
		</ExecutorContext.Provider>
	);
};
