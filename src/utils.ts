import type { Asset } from "./graphql/types";

// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
export const isDefined = <T>(value: T | null | undefined | void): value is T =>
	value != null;

export const getAssetUsdCentsPrecision = (
	asset: Pick<Asset, "priceUsd" | "decimals">,
) =>
	asset.priceUsd ? Math.round(2 + Math.log10(asset.priceUsd)) : asset.decimals;
