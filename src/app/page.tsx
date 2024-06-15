"use client";

import { useGetUserMarketPositionsQuery } from "@/graphql/GetMarketPositions.query.generated";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { ConnectKitButton } from "connectkit";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { type Address } from "viem";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import "evm-maths";

function App() {
	const account = useAccount();
	const chainId = useChainId();
	const { connected, safe, sdk } = useSafeAppsSDK();

	const { data: walletClient } = useWalletClient({ chainId: account.chainId });

	const deployForm = useForm<{ owner: Address }>({
		defaultValues: {
			owner: account.address,
		},
	});

	useEffect(() => {
		if (account.address && !deployForm.formState.dirtyFields.owner)
			deployForm.setValue("owner", account.address, {
				shouldValidate: true,
				shouldDirty: false,
			});
	}, [
		account.address,
		deployForm.formState.dirtyFields.owner,
		deployForm.setValue,
	]);

	const { data, loading, error } = useGetUserMarketPositionsQuery({
		variables: {
			address: account.address!,
			chainId,
		},
		skip: !account.address,
	});

	return (
		<>
			<ConnectKitButton theme="soft" showAvatar showBalance />

			{data?.userByAddress.marketPositions?.map((position) => (
				<div key={position.market.uniqueKey}>
					<p>Id: {position.market.uniqueKey}</p>
					<p>
						Collateral:{" "}
						{position.collateral.format(
							position.market.collateralAsset?.decimals,
							3,
						)}{" "}
						($
						{position.collateralUsd?.toFixed(2)})
					</p>
					<p>
						Borrow:{" "}
						{position.borrowAssets.format(
							position.market.loanAsset.decimals,
							3,
						)}{" "}
						($
						{position.borrowAssetsUsd?.toFixed(2)})
					</p>
				</div>
			))}
		</>
	);
}

export default App;
