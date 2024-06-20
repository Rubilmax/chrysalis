import { useDebounce } from "@uidotdev/usehooks";
import React from "react";
import { Address, getAddress } from "viem";
import { normalize } from "viem/ens";
import { useEnsAddress, useEnsName } from "wagmi";

export const ensRegex = /.+\.eth$/;

export const useAddressOrEnsInput = (
	initialAddress?: Address,
	initialEns?: string,
) => {
	const [input, setInput] = React.useState(initialAddress ?? "");

	const debouncedInput = useDebounce(input, 100);

	const parsedEns = React.useMemo(
		() =>
			ensRegex.test(debouncedInput) ? normalize(debouncedInput) : undefined,
		[debouncedInput],
	);
	const parsedAddress = React.useMemo(() => {
		try {
			return getAddress(debouncedInput);
		} catch {}
	}, [debouncedInput]);

	const [ens, setEns] = React.useState(initialEns);

	React.useEffect(() => {
		setEns(parsedEns);
	}, [parsedEns]);

	const [address, setAddress] = React.useState(initialAddress);

	React.useEffect(() => {
		setAddress(parsedAddress);
	}, [parsedAddress]);

	const { data: addressFromEns, isLoading: isLoadingAddress } = useEnsAddress({
		name: parsedEns,
	});

	React.useEffect(() => {
		setAddress(addressFromEns || undefined);
	}, [addressFromEns]);

	const { data: ensFromAddress, isLoading: isLoadingEns } = useEnsName({
		address: parsedAddress,
	});

	React.useEffect(() => {
		setEns(ensFromAddress || undefined);
	}, [ensFromAddress]);

	return {
		input,
		debouncedInput,
		setInput,
		address,
		parsedAddress,
		isLoadingAddress,
		ens,
		parsedEns,
		isLoadingEns,
	};
};
