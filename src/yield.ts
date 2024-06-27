import React from "react";
import type { Address } from "viem";
import { parseNumber } from "./format";

export const yearInSeconds = 365.25 * 24 * 60 * 60;

export const aprToApy = (apr: number) =>
	(1 + apr / yearInSeconds) ** yearInSeconds - 1;

export const useAssetApy = (address: Address) => {
	const [apy, setApy] = React.useState<number>();
	const [isFetching, startTransition] = React.useTransition();

	React.useEffect(() => {
		const controller = new AbortController();

		startTransition(() => {
			(async () => {
				switch (address) {
					// USDe (ethereum)
					case "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3":
					// sUSDe (ethereum)
					case "0x9D39A5DE30e57443BfF2A8307A4256c8797A3497": {
						const yields = await fetch(
							"https://ethena.fi/api/yields/protocol-and-staking-yield",
							{ signal: controller.signal },
						);

						const {
							protocolYield,
							stakingYield,
						}: {
							protocolYield: { lastUpdate: string; value: number };
							stakingYield: { lastUpdate: string; value: number };
						} = await yields.json();

						if (address === "0x9D39A5DE30e57443BfF2A8307A4256c8797A3497")
							return stakingYield.value / 100;

						return protocolYield.value / 100;
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

						return aprToApy(
							latest_aprs
								.map((x) => Number.parseFloat(x))
								.reduce((total, x) => total + x, 0) /
								latest_aprs.length /
								10000,
						);
					}
					// ezETH (ethereum)
					case "0xbf5495Efe5DB9ce00f80364C8B423567e58d2110":
					// ezETH (base)
					case "0x2416092f143378750bb29b79eD961ab195CcEea5": {
						const stats = await fetch("https://app.renzoprotocol.com/api/apr", {
							signal: controller.signal,
						});

						const { apr }: { apr: number } = await stats.json();

						return aprToApy(apr / 100);
					}
					// sDAI (ethereum)
					// case "0x83F20F44975D03b1b09e64809B757c47f942BEeA": {
					// }
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

						return aprToApy(pageProps.apr / 100);
					}
					// cbETH (base)
					// case "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22": {
					// }
					default:
						return 0;
				}
			})().then(setApy);
		});

		return () => {
			controller.abort("cleanup");
		};
	}, [address]);

	return [apy, isFetching] as const;
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
