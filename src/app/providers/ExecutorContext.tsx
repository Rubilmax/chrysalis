import { executorDeployData } from "@/executor";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import {
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	createContext,
	useCallback,
	useEffect,
	useState,
} from "react";
import { Address, isAddress } from "viem";
import { DeployContractErrorType } from "wagmi/actions";
import { useDeployContract } from "./NotificationContext";

export const ExecutorContext = createContext<
	| {
			executor: Address;
			setExecutor: Dispatch<SetStateAction<string | undefined>>;
			deployExecutor: (owner: Address) => Promise<void>;
			status: "idle" | "pending" | "error" | "success";
			error: DeployContractErrorType | null;
			isValid: true;
	  }
	| {
			executor?: string;
			setExecutor: Dispatch<SetStateAction<string | undefined>>;
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
}: { children: ReactNode }) => {
	const { connected, sdk } = useSafeAppsSDK();
	const { request, receipt } = useDeployContract();
	const [executor, setExecutor] = useState<string>();

	useEffect(() => {
		const storedExecutor = localStorage.getItem("executor");
		if (storedExecutor == null) return;

		setExecutor(storedExecutor);
	}, []);

	useEffect(() => {
		if (executor == null) return;

		localStorage.setItem("executor", executor);
	}, [executor]);

	const deployExecutor = useCallback(async (owner: Address) => {
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
	}, []);

	useEffect(() => {
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
