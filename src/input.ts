import "evm-maths";

import { useDebounce } from "@uidotdev/usehooks";
import React from "react";
import { type Address, getAddress } from "viem";
import { normalize } from "viem/ens";
import { useEnsAddress, useEnsName } from "wagmi";

export const ensRegex = /.+\.eth$/;

export const useAddressOrEnsInput = (initialAddress?: Address) => {
	const [input, setInput] = React.useState(initialAddress ?? "");

	const parsedEns = React.useMemo(
		() => (ensRegex.test(input) ? normalize(input) : undefined),
		[input],
	);
	const parsedAddress = React.useMemo(() => {
		try {
			return getAddress(input);
		} catch {}
	}, [input]);

	const debouncedEns = useDebounce(parsedEns, 100);
	const debouncedAddress = useDebounce(parsedAddress, 50);

	const { data: addressFromEns, isLoading: isLoadingAddress } = useEnsAddress({
		name: debouncedEns,
	});

	const { data: ensFromAddress, isLoading: isLoadingEns } = useEnsName({
		address: debouncedAddress,
	});

	return {
		input,
		setInput,
		address: parsedAddress ?? addressFromEns ?? undefined,
		parsedAddress,
		isLoadingAddress,
		ens: parsedEns ?? ensFromAddress ?? undefined,
		parsedEns,
		isLoadingEns,
	};
};
