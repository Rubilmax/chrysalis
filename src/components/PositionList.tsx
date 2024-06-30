import { useGetUserMarketPositionSummariesQuery } from "@/graphql/GetMarketPositionSummaries.query.generated";
import Paper from "@mui/material/Paper";
import Link from "next/link";
import React from "react";
import type { Address } from "viem";
import { useChainId } from "wagmi";
import MarketTitle from "./MarketTitle";

const PositionList = ({ user }: { user: Address }) => {
	const chainId = useChainId();

	const { data, loading, error } = useGetUserMarketPositionSummariesQuery({
		variables: { user, chainId },
	});

	return data?.userByAddress.marketPositions.map((position) => (
		<Link
			key={position.market.uniqueKey}
			href={`/positions/${user}/${position.market.uniqueKey}`}
			passHref
		>
			<Paper component="a">
				<MarketTitle market={position.market} />
			</Paper>
		</Link>
	));
};

export default React.memo(PositionList);
