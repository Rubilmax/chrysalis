import { useLocalStorage } from "@/localStorage";
import { usePositionApy } from "@/position";
import { getAssetUsdCentsPrecision } from "@/utils";
import type { AssetYields } from "@/yield";
import { ORACLE_PRICE_SCALE } from "@morpho-org/blue-sdk";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React from "react";
import { parseUnits } from "viem";
import type { Position } from "../app/positions/[user]/[market]/page";
import AccruingQuantity from "./AccruingQuantity";
import PositionApy from "./PositionApy";
import Token from "./Token";

const quoteAssets = ["collateral", "loan", "underlying", "usd"] as const;

const PositionSummary = ({
	position: {
		collateral,
		borrowAssets,
		market: { loanAsset, collateralAsset, collateralPrice, ...market },
	},
	collateralYields,
}: {
	position: Omit<Position, "market"> & {
		market: Omit<Position["market"], "collateralAsset" | "collateralPrice"> & {
			collateralAsset: NonNullable<Position["market"]["collateralAsset"]>;
			collateralPrice: NonNullable<Position["market"]["collateralPrice"]>;
		};
	};
	collateralYields?: AssetYields;
}) => {
	const [quoteAsset, setQuoteAsset] = useLocalStorage<
		(typeof quoteAssets)[number]
	>(`${market.uniqueKey}-quoteAsset`, "loan");

	const collateralValue = React.useMemo(
		() => collateral.mulDivDown(collateralPrice, ORACLE_PRICE_SCALE),
		[collateral, collateralPrice],
	);

	const positionApy = usePositionApy(
		collateralValue,
		borrowAssets,
		quoteAsset === "collateral" ? 0 : collateralYields?.apy,
		market.state?.borrowApy,
	);

	const balance = React.useMemo(() => {
		const loanBalance = collateralValue - borrowAssets;

		switch (quoteAsset) {
			case "loan":
				return loanBalance;
			case "collateral":
				return loanBalance.mulDivDown(ORACLE_PRICE_SCALE, collateralPrice);
			case "usd":
				return loanBalance.wadDiv(
					parseUnits((loanAsset.priceUsd ?? 0).toFixed(18), 18),
				);
			case "underlying":
				return loanBalance
					.mulDivDown(ORACLE_PRICE_SCALE, collateralPrice)
					.wadDivDown(collateralYields?.underlying?.exchangeRate ?? BigInt.WAD);
			default:
				throw Error("unknown quote asset");
		}
	}, [
		quoteAsset,
		collateralValue,
		borrowAssets,
		collateralPrice,
		loanAsset.priceUsd,
		collateralYields?.underlying?.exchangeRate,
	]);

	const precision =
		quoteAsset === "usd"
			? 2
			: quoteAsset === "underlying"
				? Math.min(collateralYields?.underlying?.decimals ?? 18, 3)
				: getAssetUsdCentsPrecision(
						quoteAsset === "collateral" ? collateralAsset : loanAsset,
					);

	return (
		<Stack direction="row" justifyContent="space-between" alignItems="center">
			<Tooltip
				placement="top"
				title={
					quoteAsset === "collateral"
						? "The value of your position quoted in the collateral asset decreases over time, because the collateral asset only accrues interest quoted in its underlying asset."
						: undefined
				}
			>
				<Button
					onClick={() =>
						setQuoteAsset((quoteAsset) => {
							const index = quoteAssets.indexOf(quoteAsset);

							let newQuoteAsset =
								quoteAssets[(index + 1) % quoteAssets.length]!;
							if (
								newQuoteAsset === "underlying" &&
								!collateralYields?.underlying
							)
								newQuoteAsset = quoteAssets[(index + 2) % quoteAssets.length]!;

							return newQuoteAsset;
						})
					}
					color="inherit"
					sx={{
						flex: 1,
						padding: 2,
						textTransform: "none",
						justifyContent: "space-between",
					}}
				>
					<Typography variant="h6" lineHeight={1.2}>
						{quoteAsset === "usd" && "$ "}
						<AccruingQuantity
							quantity={balance.toFloat(collateralAsset.decimals)}
							ratePerSecond={positionApy ?? 0}
							precision={precision}
							decimals={precision + 3}
						/>
					</Typography>
					{quoteAsset !== "usd" && (
						<Token
							symbol={
								quoteAsset === "collateral"
									? collateralAsset.symbol
									: quoteAsset === "loan"
										? loanAsset.symbol
										: collateralYields?.underlying?.symbol ?? "???"
							}
							size={20}
						/>
					)}
				</Button>
			</Tooltip>
			<Stack padding={2}>
				<PositionApy
					market={market} // TODO: use target borrow APY
					collateralValue={collateralValue}
					borrowAssets={borrowAssets}
					collateralYields={collateralYields}
					quoteAsset={quoteAsset === "collateral" ? "collateral" : "underlying"}
				/>
			</Stack>
		</Stack>
	);
};

export default React.memo(PositionSummary);
