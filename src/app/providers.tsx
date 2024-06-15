"use client";

import { createHash } from "crypto";
import { cache } from "@/graphql/cache";
import { config } from "@/wagmi";
import { ApolloClient, ApolloProvider, HttpLink } from "@apollo/client";
import { createPersistedQueryLink } from "@apollo/client/link/persisted-queries";
import { SafeProvider } from "@safe-global/safe-apps-react-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import type { ReactNode } from "react";
import { type State, WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

const apolloClient = new ApolloClient({
	cache,
	link: createPersistedQueryLink({
		sha256: (query) => createHash("sha256").update(query).digest("hex"),
		useGETForHashedQueries: true,
	}).concat(new HttpLink({ uri: "https://blue-api.morpho.org/graphql" })),
});

export function Providers({
	children,
	initialState,
}: { children: ReactNode; initialState?: State }) {
	return (
		<WagmiProvider config={config} initialState={initialState}>
			<QueryClientProvider client={queryClient}>
				<SafeProvider>
					<ConnectKitProvider>
						<ApolloProvider client={apolloClient}>{children}</ApolloProvider>
					</ConnectKitProvider>
				</SafeProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
