import { FallbackProvider, JsonRpcProvider } from "ethers";
import { useMemo } from "react";
import type { Account, Chain, Client, Transport } from "viem";
import { type Config, useConnectorClient } from "wagmi";

const clientToProvider = (client?: Client<Transport, Chain, Account>) => {
	if (!client) return;

	const { chain, transport } = client;

	const network = {
		chainId: chain.id,
		name: chain.name,
		ensAddress: chain.contracts?.ensRegistry?.address,
	};

	if (transport.type === "fallback") {
		const providers = (transport.transports as ReturnType<Transport>[]).map(
			({ value }) => new JsonRpcProvider(value?.url, network),
		);
		if (providers.length === 1) return providers[0];
		return new FallbackProvider(providers);
	}

	return new JsonRpcProvider(transport.url, network);
};

export const useEthersProvider = ({ chainId }: { chainId?: number } = {}) => {
	const { data: client } = useConnectorClient<Config>({ chainId });

	return useMemo(() => clientToProvider(client), [client]);
};
