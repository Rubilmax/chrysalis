"use client";

import { useLocalStorage } from "@uidotdev/usehooks";
import React from "react";
import { type Address, isAddress } from "viem";

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
	const [selectedExecutorAddress, setSelectedExecutor] = useLocalStorage<
		Address | undefined
	>("selectedExecutor");
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
