"use client";

import Stack from "@mui/material/Stack";
import React from "react";
import { useAccount } from "wagmi";
import PositionList from "./PositionList";

const SideBar = () => {
	const account = useAccount();

	if (!account.address) return null;

	return (
		<Stack flex={1} p={4}>
			<PositionList user={account.address} />
		</Stack>
	);
};

export default React.memo(SideBar);
