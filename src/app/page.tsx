"use client";

import { useGetUserMarketPositionsQuery } from "@/graphql/GetMarketPositions.query.generated";
import React, { useEffect, useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import "evm-maths";
import DataLink from "@/components/DataLink";
import NavBar from "@/components/NavBar";
import PositionCard from "@/components/PositionCard";
import { createToast } from "@/toast";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const App = () => {
	const account = useAccount();
	const chainId = useChainId();

	const { data, loading, error } = useGetUserMarketPositionsQuery({
		variables: {
			address: account.address!,
			chainId,
		},
		skip: !account.address,
	});

	const positions = useMemo(
		() =>
			data?.userByAddress.marketPositions?.filter(
				(position) => position.borrowShares > 0n && position.collateral > 0n,
			),
		[data],
	);

	useEffect(() => {
		const id = createToast(
			<>
				Transaction submitted with hash:{" "}
				<DataLink data="0xkzenfeihvifsenfveufbncseuifb" type="tx" />
			</>,
			{
				isLoading: true,
			},
		);
	}, []);

	return (
		<>
			<NavBar />

			<Container maxWidth="lg">
				<Stack
					direction="row"
					justifyContent="center"
					alignItems="center"
					minHeight={500}
					mt={4}
				>
					{loading ? (
						<Skeleton height={700} width={350} />
					) : (
						positions && (
							<>
								{positions.map((position) => (
									<PositionCard
										key={position.market.uniqueKey}
										position={position}
									/>
								))}
								{positions.length === 0 && (
									<Typography variant="h6" color="#666">
										You have no borrow position on Morpho.
									</Typography>
								)}
							</>
						)
					)}
				</Stack>
			</Container>
		</>
	);
};

export default App;
