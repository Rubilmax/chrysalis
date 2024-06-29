"use client";

import PositionCard from "@/components/PositionCard";
import { useGetUserMarketPositionsQuery } from "@/graphql/GetMarketPositions.query.generated";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React, { useMemo } from "react";
import { useChainId } from "wagmi";

export default function Position({
	params: { user },
}: {
	params: { user: string };
}) {
	const chainId = useChainId();

	const { data, loading, error } = useGetUserMarketPositionsQuery({
		variables: {
			address: user,
			chainId,
		},
	});

	const positions = useMemo(
		() =>
			data?.userByAddress.marketPositions?.filter(
				(position) => position.borrowShares > 0n && position.collateral > 0n,
			),
		[data],
	);

	return (
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
								This user does not have any borrow position on Morpho Blue.
							</Typography>
						)}
					</>
				)
			)}
		</Stack>
	);
}
