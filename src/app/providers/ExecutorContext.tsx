import { executorDeployData } from "@/executor";
import { useLocalStorage } from "@/localStorage";
import { useDeployContract } from "@/wagmi";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React from "react";
import { type Address, type Hash, isAddress } from "viem";
import { useAccount } from "wagmi";

export interface ExecutorDetails {
	address: Address;
	owner: Address;
	deploymentTx?: Hash;
}

export const ExecutorContext = React.createContext<{
	executor?: ExecutorDetails;
	executors: Record<Address, ExecutorDetails>;
	setSelectedExecutor: React.Dispatch<
		React.SetStateAction<Address | undefined>
	>;
	deployExecutor: () => Promise<void>;
	addExecutor: (address: ExecutorDetails) => void;
	removeExecutor: (address: Address) => void;
	status: "idle" | "pending" | "error" | "success";
}>({
	executor: undefined,
	executors: {},
	setSelectedExecutor: () => {},
	deployExecutor: async () => {},
	addExecutor: () => {},
	removeExecutor: () => {},
	status: "idle",
});

export const ExecutorContextProvider = ({
	children,
}: { children: React.ReactNode }) => {
	const account = useAccount();
	const { connected, sdk } = useSafeAppsSDK();
	const { request, receipt } = useDeployContract();

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

	const deployExecutor = React.useCallback(async () => {
		if (!account.address) return console.error("Unknown account address");

		if (connected) {
			// const tx = await sdk.txs.send({
			// 	txs: [
			// 		{
			// 			data: encodeDeployData({
			//				...executorDeployData,
			// 				args: [owner],
			// 			}),
			// 		},
			// 	],
			// });
		} else {
			request.deployContract({
				...executorDeployData,
				args: [account.address],
			});
		}
	}, [request.deployContract, account.address, connected]);

	React.useEffect(() => {
		if (!receipt.data?.contractAddress || !account.address) return;

		addExecutor({
			address: receipt.data.contractAddress,
			owner: account.address,
			deploymentTx: receipt.data.transactionHash,
		});
	}, [
		receipt.data?.contractAddress,
		receipt.data?.transactionHash,
		account.address,
		addExecutor,
	]);

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
				deployExecutor,
				addExecutor,
				removeExecutor,
				status: request.status,
			}}
		>
			{children}
		</ExecutorContext.Provider>
	);
};
