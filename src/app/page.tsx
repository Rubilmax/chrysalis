"use client";

import { useGetUserMarketPositionsQuery } from "@/graphql/GetMarketPositions.query.generated";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { type Address } from "viem";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import "evm-maths";
import NavBar from "@/components/NavBar";
import Position from "@/components/Position";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import InputBase from "@mui/material/InputBase";
import { alpha, styled } from "@mui/material/styles";

function App() {
	const account = useAccount();
	const chainId = useChainId();
	const { connected, safe, sdk } = useSafeAppsSDK();

	const { data: walletClient } = useWalletClient({ chainId: account.chainId });

	const deployForm = useForm<{ owner: Address }>({
		defaultValues: {
			owner: account.address,
		},
	});

	useEffect(() => {
		if (account.address && !deployForm.formState.dirtyFields.owner)
			deployForm.setValue("owner", account.address, {
				shouldValidate: true,
				shouldDirty: false,
			});
	}, [
		account.address,
		deployForm.formState.dirtyFields.owner,
		deployForm.setValue,
	]);

	const { data, loading, error } = useGetUserMarketPositionsQuery({
		variables: {
			address: account.address!,
			chainId,
		},
		skip: !account.address,
	});

	return (
		<>
			<NavBar />

			<Container maxWidth="lg">
				<Box display="flex" justifyContent="center" marginTop={4}>
					{data?.userByAddress.marketPositions?.map((position) => (
						<Position key={position.market.uniqueKey} position={position} />
					))}
				</Box>
			</Container>
		</>
	);
}

export default App;
