"use client";

import { config } from "@/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import type { ReactNode } from "react";
import { type State, WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

export function Providers({
	children,
	initialState,
}: { children: ReactNode; initialState?: State }) {
	return (
		<WagmiProvider config={config} initialState={initialState}>
			<QueryClientProvider client={queryClient}>
				<ConnectKitProvider>{children}</ConnectKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
