import { cbEthAbi } from "@/abis";
import React from "react";
import { type Address, erc20Abi, erc4626Abi } from "viem";
import { useChainId, usePublicClient } from "wagmi";
import { base, mainnet } from "wagmi/chains";
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

const yieldAbi = [...erc4626Abi, ...cbEthAbi] as const;

export interface AssetYields {
	apy: number;
	dailyApy: number;
	weeklyApy: number;
	monthlyApy: number;
	underlying?: {
		address: Address;
		symbol?: string;
		name?: string;
		decimals?: number;
		exchangeRate: bigint;
	};
}

export const useAssetYields = (address: Address) => {
	const [yields, setYields] = React.useState<AssetYields>();
	const [isFetching, startTransition] = React.useTransition();

	const client = usePublicClient();
	const chainId = useChainId();

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
						const yields: AssetYields = {
							apy: 0,
							dailyApy: 0,
							weeklyApy: 0,
							monthlyApy: 0,
						};

						const blockDelay = blockDelays[chainId];
						if (client != null && blockDelay) {
							const blockNumber = await client.getBlockNumber();

							const blockNumbers = [
								blockNumber,
								blockNumber - BigInt(Math.ceil(dayInSeconds / blockDelay)),
								blockNumber - BigInt(Math.ceil(weekInSeconds / blockDelay)),
								blockNumber - BigInt(Math.ceil(monthInSeconds / blockDelay)),
							];

							const [asset, now, dayAgo, weekAgo, monthAgo] = await Promise.all(
								[
									client
										.readContract({
											address,
											abi: yieldAbi,
											functionName: "asset",
											blockNumber,
										})
										.catch(() => undefined),
									...blockNumbers.map(
										async (blockNumber) =>
											[
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
											] as const,
									),
								],
							);

							// All of these are guaranteed to be defined thanks to the "0n" fallback value.
							const value = now!.find(isDefined)!;
							const value1DAgo = dayAgo!.find(isDefined)!;
							const value1WAgo = weekAgo!.find(isDefined)!;
							const value1MAgo = monthAgo!.find(isDefined)!;

							if (asset) {
								const [symbol, name, decimals] = await Promise.all([
									client
										.readContract({
											address: asset,
											abi: erc20Abi,
											functionName: "symbol",
											blockNumber,
										})
										.catch(() => undefined),
									client
										.readContract({
											address: asset,
											abi: erc20Abi,
											functionName: "name",
											blockNumber,
										})
										.catch(() => undefined),
									client
										.readContract({
											address: asset,
											abi: erc20Abi,
											functionName: "decimals",
											blockNumber,
										})
										.catch(() => undefined),
								]);

								yields.underlying = {
									address: asset,
									symbol,
									name,
									decimals,
									exchangeRate: value,
								};
							}

							if (value1DAgo > 0n)
								yields.apy = yields.dailyApy =
									(1 + (value - value1DAgo).wadDiv(value1DAgo).toWadFloat()) **
										(yearInSeconds / dayInSeconds) -
									1;
							if (value1WAgo > 0n)
								yields.weeklyApy =
									(1 + (value - value1WAgo).wadDiv(value1WAgo).toWadFloat()) **
										(yearInSeconds / weekInSeconds) -
									1;
							if (value1MAgo > 0n)
								yields.monthlyApy =
									(1 + (value - value1MAgo).wadDiv(value1MAgo).toWadFloat()) **
										(yearInSeconds / monthInSeconds) -
									1;
						}

						return yields;
					}
				}
			})().then((yields) =>
				setYields({
					dailyApy: yields.apy,
					weeklyApy: yields.apy,
					monthlyApy: yields.apy,
					...yields,
				}),
			);
		});

		return () => {
			controller.abort("cleanup");
		};
	}, [address, client, chainId]);

	return [yields, isFetching] as const;
};
