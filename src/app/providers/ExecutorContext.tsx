import { executorDeployData } from "@/executor";
import { useLocalStorage } from "@/localStorage";
import { useDeployContract } from "@/wagmi";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React from "react";
import { Address, Hash, isAddress } from "viem";
import { useAccount } from "wagmi";

export interface ExecutorDetails {
	address: Address;
	owner: Address;
	deploymentTx?: Hash;
}

export const ExecutorContext = React.createContext<{
	executors: Record<Address, ExecutorDetails>;
	selectedExecutor?: ExecutorDetails;
	setSelectedExecutor: React.Dispatch<
		React.SetStateAction<Address | undefined>
	>;
	deployExecutor: () => Promise<void>;
	addExecutor: (address: ExecutorDetails) => void;
	status: "idle" | "pending" | "error" | "success";
}>({
	executors: {},
	selectedExecutor: undefined,
	setSelectedExecutor: () => {},
	deployExecutor: async () => {},
	addExecutor: () => {},
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

	const addExecutor = React.useCallback((executor: ExecutorDetails) => {
		if (!isAddress(executor.address)) return;

		setExecutors((executors) => ({
			...executors,
			[executor.address]: executor,
		}));
	}, []);

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
	}, [request.deployContract]);

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
	]);

	const selectedExecutor = React.useMemo(
		() =>
			selectedExecutorAddress ? executors[selectedExecutorAddress] : undefined,
		[selectedExecutorAddress, executors],
	);

	return (
		<ExecutorContext.Provider
			value={{
				executors,
				selectedExecutor,
				setSelectedExecutor,
				deployExecutor,
				addExecutor,
				status: request.status,
			}}
		>
			{children}
		</ExecutorContext.Provider>
	);
};
