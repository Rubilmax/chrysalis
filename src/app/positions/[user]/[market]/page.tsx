import type { GetUserMarketPositionQuery } from "@/graphql/GetMarketPosition.query.generated";
import type { Metadata } from "next";
import type React from "react";
import Guard from "./guard";

export type Position = GetUserMarketPositionQuery["marketPosition"];

export const metadata: Metadata = {
	title: "Position",
};

export async function generateStaticParams() {
	return [
		{
			user: "rubilmax.eth",
			market:
				"0x39d11026eae1c6ec02aa4c0910778664089cdd97c3fd23f68f7cd05e2e95af48",
		},
	];
}

export default function Position(props: {
	params: { user: string; market: string };
}) {
	return <Guard {...props} />;
}
