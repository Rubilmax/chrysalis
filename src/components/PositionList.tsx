import { useGetUserMarketPositionSummariesQuery } from "@/graphql/GetMarketPositionSummaries.query.generated";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
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
		<Paper
			key={position.market.uniqueKey}
			component={Link}
			href={`/positions/${user}/${position.market.uniqueKey}`}
		>
			<MarketTitle market={position.market} noLink />
		</Paper>
	));
};

export default React.memo(PositionList);
