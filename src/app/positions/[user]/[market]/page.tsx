import PositionPage from "@/components/PositionPage";
import React from "react";
import { isAddress, isHex } from "viem";

export default function Position({
	params: { user, market },
}: {
	params: { user: string; market: string };
}) {
	if (!isAddress(user) || !isHex(market) || market.length !== 66) return null;

	return <PositionPage user={user} market={market} />;
}
