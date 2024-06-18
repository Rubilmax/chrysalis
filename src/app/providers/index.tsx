"use client";

import { createHash } from "crypto";
import { cache } from "@/graphql/cache";
import theme from "@/theme";
import { config } from "@/wagmi";
import { ApolloClient, ApolloProvider, HttpLink } from "@apollo/client";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { SafeProvider } from "@safe-global/safe-apps-react-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { type ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import { type State, WagmiProvider } from "wagmi";
import { ExecutorContextProvider } from "./ExecutorContext";
import { NotificationContextProvider } from "./NotificationContext";
import "react-toastify/dist/ReactToastify.min.css";

const queryClient = new QueryClient();

const apolloClient = new ApolloClient({
	cache,
	link: createPersistedQueryLink({
		sha256: (query) => createHash("sha256").update(query).digest("hex"),
		useGETForHashedQueries: true,
	}).concat(new HttpLink({ uri: "https://blue-api.morpho.org/graphql" })),
});

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
									<ToastContainer
										position="bottom-right"
										autoClose={4000}
										pauseOnHover
									/>

									<NotificationContextProvider>
										<ExecutorContextProvider>
											{children}
										</ExecutorContextProvider>
									</NotificationContextProvider>
								</ThemeProvider>
							</AppRouterCacheProvider>
						</ApolloProvider>
					</ConnectKitProvider>
				</SafeProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
};
