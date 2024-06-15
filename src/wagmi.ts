import { getDefaultConfig } from "connectkit";
import { createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import {
	coinbaseWallet,
	injected,
	metaMask,
	safe,
	walletConnect,
} from "wagmi/connectors";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;

export const config = createConfig(
	getDefaultConfig({
		walletConnectProjectId,
		chains: [mainnet, sepolia],
		connectors: [
			injected(),
			coinbaseWallet({ appName: "Chrysalis" }),
			walletConnect({ projectId: walletConnectProjectId }),
			metaMask(),
			safe(),
		],
		ssr: true,
		appName: "Chrysalis",
		appDescription: "Minimalist widget for Morpho Blue",
		appUrl: "https://rubilmax.github.io/chrysalis/",
		appIcon: "https://cdn.morpho.xyz/assets/logos/morpho.png", // no bigger than 1024x1024px (max. 1MB)
	}),
);

declare module "wagmi" {
	interface Register {
		config: typeof config;
	}
}
