"use client";

import { useGetUserMarketPositionsQuery } from "@/graphql/GetMarketPositions.query.generated";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React from "react";
import { useAccount, useChainId } from "wagmi";
import "evm-maths";
import NavBar from "@/components/NavBar";
import Position from "@/components/Position";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

function App() {
	const account = useAccount();
	const chainId = useChainId();
	const { connected, safe, sdk } = useSafeAppsSDK();

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
