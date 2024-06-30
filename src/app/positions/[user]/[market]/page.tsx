"use client";

import PositionCard from "@/components/PositionCard";
import { useGetUserMarketPositionQuery } from "@/graphql/GetMarketPosition.query.generated";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import React from "react";
import type { Address, Hex } from "viem";
import { useChainId } from "wagmi";

export default function Position({
	params: { user, market },
}: {
	params: { user: Address; market: Hex };
}) {
	const chainId = useChainId();

	const { data, loading, error } = useGetUserMarketPositionQuery({
		variables: {
			user,
			market,
			chainId,
		},
	});

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
				data?.marketPosition && (
					<PositionCard
						key={data.marketPosition.market.uniqueKey}
						position={data.marketPosition}
					/>
				)
			)}
		</Stack>
	);
}
