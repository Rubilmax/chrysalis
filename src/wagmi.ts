import { getDefaultConfig } from "connectkit";
import { createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, safe } from "wagmi/connectors";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;
const appLogoUrl = "https://rubilmax.github.io/chrysalis/chrysalis.png";

export const config = createConfig(
	getDefaultConfig({
		walletConnectProjectId,
		chains: [mainnet, sepolia],
		connectors: [
			injected(),
			coinbaseWallet({ appName: "Chrysalis", appLogoUrl }),
			safe(),
		],
		ssr: true,
		appName: "Chrysalis",
		appDescription: "Minimalist widget for Morpho Blue",
		appUrl: "https://rubilmax.github.io/chrysalis/",
		appIcon: appLogoUrl, // no bigger than 1024x1024px (max. 1MB)
	}),
);

declare module "wagmi" {
	interface Register {
		config: typeof config;
	}
}
