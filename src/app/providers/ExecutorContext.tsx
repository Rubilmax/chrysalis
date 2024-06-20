import { executorDeployData } from "@/executor";
import { useDeployContract } from "@/wagmi";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React from "react";
import { Address, isAddress } from "viem";
import { DeployContractErrorType } from "wagmi/actions";

export const ExecutorContext = React.createContext<
	| {
			executor: Address;
			setExecutor: React.Dispatch<React.SetStateAction<string | undefined>>;
			deployExecutor: (owner: Address) => Promise<void>;
			status: "idle" | "pending" | "error" | "success";
			error: DeployContractErrorType | null;
			isValid: true;
	  }
	| {
			executor?: string;
			setExecutor: React.Dispatch<React.SetStateAction<string | undefined>>;
			deployExecutor: (owner: Address) => Promise<void>;
			status: "idle" | "pending" | "error" | "success";
			error: DeployContractErrorType | null;
			isValid: false;
	  }
>({
	setExecutor: () => {},
	deployExecutor: async () => {},
	status: "idle",
	error: null,
	isValid: false,
});

export const ExecutorContextProvider = ({
	children,
}: { children: React.ReactNode }) => {
	const { connected, sdk } = useSafeAppsSDK();
	const { request, receipt } = useDeployContract();
	const [executor, setExecutor] = React.useState<string>();

	React.useEffect(() => {
		const storedExecutor = localStorage.getItem("executor");
		if (storedExecutor == null) return;

		setExecutor(storedExecutor);
	}, []);

	React.useEffect(() => {
		if (executor == null) return;

		localStorage.setItem("executor", executor);
	}, [executor]);

	const deployExecutor = React.useCallback(
		async (owner: Address) => {
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
					args: [owner],
				});
			}
		},
		[request.deployContract],
	);

	React.useEffect(() => {
		if (!receipt.data?.contractAddress) return;

		setExecutor(receipt.data.contractAddress);
	}, [receipt]);

	return (
		<ExecutorContext.Provider
			value={
				executor && isAddress(executor.toLowerCase())
					? {
							executor: executor as Address,
							setExecutor,
							deployExecutor,
							status: request.status,
							error: request.error,
							isValid: true,
						}
					: {
							executor,
							setExecutor,
							deployExecutor,
							status: request.status,
							error: request.error,
							isValid: false,
						}
			}
		>
			{children}
		</ExecutorContext.Provider>
	);
};
