import { useGetUserMarketPositionSummariesQuery } from "@/graphql/GetMarketPositionSummaries.query.generated";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import React from "react";
import type { Address } from "viem";
import { useChainId } from "wagmi";
import MarketTitle from "./MarketTitle";

const PositionList = ({ user }: { user: Address }) => {
	const chainId = useChainId();

	const { data, loading, error } = useGetUserMarketPositionSummariesQuery({
		variables: { user, chainId },
	});

	if (loading)
		return new Array(3)
			.fill(null)
			.map((_, i) => i)
			.map((i) => <Skeleton key={i} height={200} />);

	return data?.userByAddress.marketPositions.map((position) => (
		<Paper key={position.market.uniqueKey}>
			<Button
				component={Link}
				href={`/positions/${user}/${position.market.uniqueKey}`}
				color="inherit"
				sx={{ display: "flex", alignItems: "center", textTransform: "none" }}
				fullWidth
			>
				<ChevronLeftIcon fontSize="large" color="action" sx={{ margin: 2 }} />
				<Stack flex={1}>
					<MarketTitle market={position.market} noLink />
				</Stack>
			</Button>
		</Paper>
	));
};

export default React.memo(PositionList);
