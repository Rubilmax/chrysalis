import React from "react";
import type { Address } from "viem";
import { useBlockNumber, useChainId, usePublicClient } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { parseNumber } from "./format";
import { isDefined } from "./utils";

export const dayInSeconds = 24 * 60 * 60;
export const weekInSeconds = 7 * dayInSeconds;
export const yearInSeconds = 365.25 * dayInSeconds;
export const monthInSeconds = yearInSeconds / 12;

export const aprToApy = (apr: number) =>
	(1 + apr / yearInSeconds) ** yearInSeconds - 1;

export const blockDelays: Record<number, number> = {
	[mainnet.id]: 12,
	[base.id]: 2,
};

const yieldAbi = [
	// ERC-4626
	{
		inputs: [
			{
				internalType: "uint256",
				name: "shares",
				type: "uint256",
			},
		],
		name: "convertToAssets",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	// cbETH
	{
		inputs: [],
		name: "exchangeRate",
		outputs: [
			{
				internalType: "uint256",
				name: "_exchangeRate",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
] as const;

export const useAssetApys = (address: Address) => {
	const [apy, setApy] = React.useState<number>();
	const [dailyApy, setDailyApy] = React.useState<number>();
	const [weeklyApy, setWeeklyApy] = React.useState<number>();
	const [monthlyApy, setMonthlyApy] = React.useState<number>();
	const [isFetching, startTransition] = React.useTransition();

	const client = usePublicClient();
	const chainId = useChainId();
	const { data: blockNumber } = useBlockNumber();

	console.log(blockNumber); // TODO: check if polling (should not)

	React.useEffect(() => {
		const controller = new AbortController();

		startTransition(() => {
			(async () => {
				switch (address) {
					// USDe (ethereum)
					case "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3": {
						const yields = await fetch(
							"https://ethena.fi/api/yields/protocol-and-staking-yield",
							{ signal: controller.signal },
						);

						const {
							protocolYield,
						}: {
							protocolYield: { lastUpdate: string; value: number };
							stakingYield: { lastUpdate: string; value: number };
						} = await yields.json();

						return { apy: protocolYield.value / 100 };
					}
					// eETH (ethereum)
					case "0x35fA164735182de50811E8e2E824cFb9B6118ac2":
					// weETH (ethereum)
					case "0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee":
					// weETH (base)
					case "0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A": {
						const aprs = await fetch(
							"https://www.etherfi.bid/api/etherfi/apr",
							{ signal: controller.signal },
						);

						const { latest_aprs }: { sucess: boolean; latest_aprs: string[] } =
							await aprs.json();

						return {
							apy: aprToApy(
								latest_aprs
									.map((x) => Number.parseFloat(x))
									.reduce((total, x) => total + x, 0) /
									latest_aprs.length /
									10000,
							),
						};
					}
					// ezETH (ethereum)
					case "0xbf5495Efe5DB9ce00f80364C8B423567e58d2110":
					// ezETH (base)
					case "0x2416092f143378750bb29b79eD961ab195CcEea5": {
						const stats = await fetch("https://app.renzoprotocol.com/api/apr", {
							signal: controller.signal,
						});

						const { apr }: { apr: number } = await stats.json();

						return { apy: aprToApy(apr / 100) };
					}
					// stETH (ethereum)
					case "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84":
					// wstETH (ethereum)
					case "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0":
					// wstETH (base)
					case "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452": {
						const stats = await fetch(
							"https://lido.fi/_next/data/pirTXdDbSW-Rd69FlVhLJ/index.json",
							{ signal: controller.signal },
						);

						const { pageProps }: { pageProps: { apr: number } } =
							await stats.json();

						return { apy: aprToApy(pageProps.apr / 100) };
					}
					// cbETH (ethereum)
					// case "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704":
					// cbETH (base)
					// case "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22": {
					// 	// biome-ignore lint/suspicious/noFallthroughSwitchClause: <explanation>
					// 	address = "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704";
					// }
					default: {
						let apy = 0;
						let dailyApy = 0;
						let weeklyApy = 0;
						let monthlyApy = 0;

						const blockDelay = blockDelays[chainId];
						if (client != null && blockNumber != null && blockDelay) {
							const blockNumbers = [
								blockNumber,
								blockNumber - BigInt(Math.ceil(dayInSeconds / blockDelay)),
								blockNumber - BigInt(Math.ceil(weekInSeconds / blockDelay)),
								blockNumber - BigInt(Math.ceil(monthInSeconds / blockDelay)),
							];

							const [now, dayAgo, weekAgo, monthAgo] = await Promise.all(
								blockNumbers.map(async (blockNumber) => [
									await client
										.readContract({
											address,
											abi: yieldAbi,
											functionName: "convertToAssets",
											args: [BigInt.WAD],
											blockNumber,
										})
										.catch(() => undefined),
									await client
										.readContract({
											address,
											abi: yieldAbi,
											functionName: "exchangeRate",
											blockNumber,
										})
										.catch(() => undefined),
									0n, // Fallback to zero.
								]),
							);

							// All of these are guaranteed to be defined thanks to the "0n" fallback value.
							const value = now!.find(isDefined)!;
							const value1DAgo = dayAgo!.find(isDefined)!;
							const value1WAgo = weekAgo!.find(isDefined)!;
							const value1MAgo = monthAgo!.find(isDefined)!;

							if (value1DAgo > 0n)
								apy = dailyApy =
									(1 +
										(value - value1DAgo).wadDiv(value1DAgo).toWadFloat() /
											dayInSeconds) **
										yearInSeconds -
									1;
							if (value1WAgo > 0n)
								weeklyApy =
									(1 +
										(value - value1WAgo).wadDiv(value1WAgo).toWadFloat() /
											weekInSeconds) **
										yearInSeconds -
									1;
							if (value1MAgo > 0n)
								monthlyApy =
									(1 +
										(value - value1MAgo).wadDiv(value1MAgo).toWadFloat() /
											monthInSeconds) **
										yearInSeconds -
									1;
						}

						return { apy, dailyApy, weeklyApy, monthlyApy };
					}
				}
			})().then(
				({ apy, dailyApy = apy, weeklyApy = apy, monthlyApy = apy }) => {
					setApy(apy);
					setDailyApy(dailyApy);
					setWeeklyApy(weeklyApy);
					setMonthlyApy(monthlyApy);
				},
			);
		});

		return () => {
			controller.abort("cleanup");
		};
	}, [address, blockNumber, client, chainId]);

	return [{ apy, dailyApy, weeklyApy, monthlyApy }, isFetching] as const;
};

export const usePositionApy = (
	collateralValue: bigint | undefined,
	borrowAssets: bigint | undefined,
	collateralApy: number | undefined,
	borrowApy: number | null | undefined,
) =>
	React.useMemo(() => {
		if (
			collateralValue == null ||
			borrowAssets == null ||
			collateralApy == null ||
			borrowApy == null
		)
			return;
		if (collateralValue === borrowAssets) {
			if (borrowAssets === 0n) return 0;

			return Number.POSITIVE_INFINITY;
		}

		return (
			collateralValue.wadMul(parseNumber(collateralApy)) -
			borrowAssets.wadMul(parseNumber(borrowApy))
		)
			.wadDiv(collateralValue - borrowAssets)
			.toWadFloat();
	}, [collateralValue, borrowAssets, collateralApy, borrowApy]);
