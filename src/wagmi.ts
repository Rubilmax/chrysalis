import { defaultWagmiConfig } from "@web3modal/wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const config = defaultWagmiConfig({
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  metadata: {
    name: "chrysalis",
    description: "Chrysalis",
    url: "https://rubilmax.github.io/chrysalis/",
    icons: [],
  },
  chains: [mainnet, sepolia],
  connectors: [injected(), coinbaseWallet({ appName: "Chrysalis" })],
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
