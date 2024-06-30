"use client";

import {
	type GetUserMarketPositionQuery,
	useGetUserMarketPositionQuery,
} from "@/graphql/GetMarketPosition.query.generated";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import type { Address, Hex } from "viem";
import { useChainId } from "wagmi";
import MarketTitle from "./MarketTitle";
import PositionContent from "./PositionContent";

export type Position = GetUserMarketPositionQuery["marketPosition"];

const PositionPage = ({ user, market }: { user: Address; market: Hex }) => {
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
					<Paper>
						<MarketTitle market={data.marketPosition.market} />
						<Divider />
						{data.marketPosition.market.collateralAsset &&
						data.marketPosition.market.collateralPrice != null ? (
							<PositionContent
								// @ts-ignore
								position={data.marketPosition}
							/>
						) : (
							<Stack padding={2}>
								<Typography variant="caption" color="error">
									Unknown collateral
								</Typography>
							</Stack>
						)}
					</Paper>
				)
			)}
		</Stack>
	);
};

export default React.memo(PositionPage);
