"use client";

import Stack from "@mui/material/Stack";
import React from "react";
import { useAccount } from "wagmi";
import PositionList from "./PositionList";

const Sidebar = () => {
	const account = useAccount();

	if (!account.address) return null;

	return (
		<Stack flex={1}>
			<PositionList user={account.address} />
		</Stack>
	);
};

export default React.memo(Sidebar);
