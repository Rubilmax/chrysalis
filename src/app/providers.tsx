"use client";

import { createHash } from "crypto";
import { executorDeployData } from "@/executor";
import { cache } from "@/graphql/cache";
import theme from "@/theme";
import { config } from "@/wagmi";
import { ApolloClient, ApolloProvider, HttpLink } from "@apollo/client";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { SafeProvider, useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
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
import {
	type State,
	WagmiProvider,
	useDeployContract,
	useWaitForTransactionReceipt,
} from "wagmi";
import { DeployContractErrorType } from "wagmi/actions";

const queryClient = new QueryClient();

const apolloClient = new ApolloClient({
	cache,
	link: createPersistedQueryLink({
		sha256: (query) => createHash("sha256").update(query).digest("hex"),
		useGETForHashedQueries: true,
	}).concat(new HttpLink({ uri: "https://blue-api.morpho.org/graphql" })),
});

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
	const { data: hash, status, error, deployContract } = useDeployContract();
	const { data: receipt } = useWaitForTransactionReceipt({ hash });
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
			deployContract({
				...executorDeployData,
				args: [owner],
			});
		}
	}, []);

	useEffect(() => {
		if (!receipt?.contractAddress) return;

		setExecutor(receipt.contractAddress);
	}, [receipt]);

	return (
		<ExecutorContext.Provider
			value={
				executor && isAddress(executor.toLowerCase())
					? {
							executor: executor as Address,
							setExecutor,
							deployExecutor,
							status,
							error,
							isValid: true,
						}
					: {
							executor,
							setExecutor,
							deployExecutor,
							status,
							error,
							isValid: false,
						}
			}
		>
			{children}
		</ExecutorContext.Provider>
	);
};

export const Providers = ({
	children,
	initialState,
}: { children: ReactNode; initialState?: State }) => {
	return (
		<WagmiProvider config={config} initialState={initialState}>
			<QueryClientProvider client={queryClient}>
				<SafeProvider>
					<ConnectKitProvider>
						<ApolloProvider client={apolloClient}>
							<AppRouterCacheProvider>
								<ThemeProvider theme={theme}>
									<ExecutorContextProvider>{children}</ExecutorContextProvider>
								</ThemeProvider>
							</AppRouterCacheProvider>
						</ApolloProvider>
					</ConnectKitProvider>
				</SafeProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
};
