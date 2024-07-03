"use client";

import { useGetUserMarketPositionQuery } from "@/graphql/GetMarketPosition.query.generated";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import type { Address, Hex } from "viem";
import { isAddress, isHex } from "viem";
import { useChainId } from "wagmi";
import { useEnsAddress } from "wagmi";
import MarketTitle from "../../../../components/MarketTitle";
import PositionContent from "../../../../components/PositionContent";
import Loading from "./loading";

const Page = React.memo(({ user, market }: { user: Address; market: Hex }) => {
	const chainId = useChainId();

	const { data, loading, error } = useGetUserMarketPositionQuery({
		variables: {
			user,
			market,
			chainId,
		},
	});

	if (loading) return <Loading />;

	return (
		data?.marketPosition && (
			<Paper variant="transparent">
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
	);
});

export default function PositionGuard({
	params: { user, market },
}: {
	params: { user: string; market: string };
}) {
	const { data: resolvedAddress, isLoading } = useEnsAddress({ name: user });

	if (!isHex(market) || market.length !== 66) return null;

	if (isLoading) return <Loading />;

	const address = resolvedAddress || user;
	if (!isAddress(address)) return null;

	return <Page user={address} market={market} />;
}
