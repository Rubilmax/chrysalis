import { InMemoryCache, TypePolicies, TypePolicy } from "@apollo/client";
import {
	Asset,
	BigIntDataPoint,
	ChainSynchronizationState,
	CollateralAtRiskDataPoint,
	Market,
	MarketBadDebt,
	MarketCollateralTransferTransactionData,
	MarketLiquidationTransactionData,
	MarketOracleFeed,
	MarketPosition,
	MarketState,
	MarketStateReward,
	MarketTransferTransactionData,
	MorphoBlueState,
	Transaction,
	Vault,
	VaultAllocation,
	VaultPosition,
	VaultReallocate,
	VaultState,
	VaultTransactionData,
} from "./types";

type BigIntFieldsMapping = {
	Asset: Array<keyof Asset>;
	Market: Array<keyof Market>;
	Vault: Array<keyof Vault>;
	VaultState: Array<keyof VaultState>;
	VaultPosition: Array<keyof VaultPosition>;
	Transaction: Array<keyof Transaction>;
	MarketCollateralTransferTransactionData: Array<
		keyof MarketCollateralTransferTransactionData
	>;
	MarketLiquidationTransactionData: Array<
		keyof MarketLiquidationTransactionData
	>;
	MarketPosition: Array<keyof MarketPosition>;
	MarketState: Array<keyof MarketState>;
	MarketStateReward: Array<keyof MarketStateReward>;
	VaultTransactionData: Array<keyof VaultTransactionData>;
	MarketTransferTransactionData: Array<keyof MarketTransferTransactionData>;
	VaultAllocation: Array<keyof VaultAllocation>;
	VaultReallocate: Array<keyof VaultReallocate>;
	BigIntDataPoint: Array<keyof BigIntDataPoint>;
	ChainSynchronizationState: Array<keyof ChainSynchronizationState>;
	MarketBadDebt: Array<keyof MarketBadDebt>;
	MarketOracleFeed: Array<keyof MarketOracleFeed>;
	MorphoBlueState: Array<keyof MorphoBlueState>;
	CollateralAtRiskDataPoint: Array<keyof CollateralAtRiskDataPoint>;
};

const bigIntFieldsMapping: BigIntFieldsMapping = {
	Asset: ["totalSupply"],
	Market: [
		"lltv",
		"creationTimestamp",
		"collateralPrice",
		"reallocatableLiquidityAssets",
	],
	Vault: ["creationTimestamp"],
	VaultState: ["timestamp", "totalAssets", "totalSupply", "timelock"],
	VaultPosition: ["assets", "shares"],
	Transaction: ["timestamp", "blockNumber"],
	MarketCollateralTransferTransactionData: ["assets"],
	MarketLiquidationTransactionData: [
		"badDebtAssets",
		"badDebtShares",
		"repaidAssets",
		"repaidShares",
		"seizedAssets",
	],
	MarketPosition: [
		"borrowAssets",
		"borrowShares",
		"supplyAssets",
		"supplyShares",
		"collateral",
	],
	MarketState: [
		"borrowAssets",
		"supplyAssets",
		"liquidityAssets",
		"collateralAssets",
		"borrowShares",
		"supplyShares",
		"timestamp",
	],
	MarketStateReward: [
		"yearlyBorrowTokens",
		"yearlySupplyTokens",
		"amountPerSuppliedToken",
		"amountPerBorrowedToken",
		"yearlyBorrowTokens",
		"yearlySupplyTokens",
	],
	MorphoBlueState: ["timestamp"],
	VaultTransactionData: ["assets", "shares"],
	MarketTransferTransactionData: ["assets", "shares"],
	VaultAllocation: ["supplyAssets", "supplyCap", "supplyShares"],
	VaultReallocate: ["shares", "timestamp", "assets", "blockNumber"],
	BigIntDataPoint: ["y"],
	ChainSynchronizationState: ["blockNumber"],
	MarketBadDebt: ["underlying"],
	MarketOracleFeed: [
		"scaleFactor",
		"baseVaultConversionSample",
		"quoteVaultConversionSample",
	],
	CollateralAtRiskDataPoint: ["collateralAssets"],
};

function mergeTypePolicy(typePolicy: TypePolicy, newTypePolicy: TypePolicy) {
	return {
		...typePolicy,
		...newTypePolicy,
		fields: {
			...typePolicy.fields,
			...newTypePolicy.fields,
		},
	};
}

function mergeTypePolicies(
	typePolicies: TypePolicies,
	newTypePolicies: TypePolicies,
): TypePolicies {
	return Object.entries(newTypePolicies).reduce(
		(acc, [type, policy]) => {
			const current = acc[type];
			if (current) {
				acc[type] = mergeTypePolicy(current, policy);
			} else {
				acc[type] = policy;
			}
			return acc;
		},
		{ ...typePolicies },
	);
}

const bigIntFieldsTypePolicies: TypePolicies = Object.entries(
	bigIntFieldsMapping,
).reduce((acc, [type, fields]) => {
	acc[type] = {
		fields: [...fields].reduce(
			(acc, field) => {
				acc[field] = {
					read(value: string | number | undefined | null) {
						if (value == null) return value;

						return BigInt(value);
					},
				};
				return acc;
			},
			{} as Exclude<TypePolicy["fields"], undefined>,
		),
	};
	return acc;
}, {} as TypePolicies);

const typePolicies: TypePolicies = {
	Vault: {
		fields: {
			historicalState: {
				// Fixes issue with cache causing infinite query loop when querying vault history through multiple queries
				merge: true,
			},
		},
	},
	VaultHistory: {
		fields: {
			allocation: {
				// Merges two arrays of VaultAllocation objects, where the merge is based on the market id
				// Vault id must be queried for this to work.
				// https://www.apollographql.com/docs/react/caching/cache-field-behavior/#merging-arrays-of-non-normalized-objects
				merge: (
					existing: any[],
					incoming: any[],
					{ readField, mergeObjects },
				) => {
					const merged: any[] = existing ? existing.slice(0) : [];
					const vaultIdToIndex = new Map<string, number>();
					if (existing) {
						existing.forEach((allocation, index) => {
							const market = readField<Market>("market", allocation);
							const marketId = readField<string>("id", market);
							if (!marketId) {
								throw new Error(
									'Expected "market.id" field to be defined. Check that the "market" field is present in the query',
								);
							}
							vaultIdToIndex.set(marketId, index);
						});
					}
					incoming.forEach((allocation) => {
						const market = readField<Market>("market", allocation);
						const marketId = readField<string>("id", market);
						if (marketId && vaultIdToIndex.has(marketId)) {
							const index = vaultIdToIndex.get(marketId)!;
							merged[index] = mergeObjects(merged[index], allocation);
						} else {
							merged.push(allocation);
						}
					});
					return merged;
				},
			},
		},
	},
	Market: {
		fields: {
			state: {
				merge: true,
			},
			historicalState: {
				// Fixes issue with cache causing infinite query loop when querying market history through multiple queries
				merge: true,
			},
			dailyApys: {
				merge: true,
			},
			weeklyApys: {
				merge: true,
			},
			monthlyApys: {
				merge: true,
			},
		},
	},
	MarketState: {
		fields: {
			rewards: {
				// Merges two arrays of MarketStateReward objects, where the merge is based on the asset id
				// Asset id must be queried for this to work.
				// https://www.apollographql.com/docs/react/caching/cache-field-behavior/#merging-arrays-of-non-normalized-objects
				merge: (
					existing: any[],
					incoming: any[],
					{ readField, mergeObjects },
				) => {
					const merged: any[] = existing ? existing.slice(0) : [];
					const assetIdToIndex = new Map<string, number>();
					if (existing) {
						existing.forEach((marketStateReward, index) => {
							const asset = readField<Asset>("asset", marketStateReward);
							const assetId = readField<string>("id", asset);
							if (!assetId) {
								throw new Error(
									'Expected "asset.id" field to be defined. Check that the "asset" field is present in the query',
								);
							}
							assetIdToIndex.set(assetId, index);
						});
					}
					incoming.forEach((marketStateReward) => {
						const asset = readField<Asset>("asset", marketStateReward);
						const assetId = readField<string>("id", asset);
						if (assetId && assetIdToIndex.has(assetId)) {
							const index = assetIdToIndex.get(assetId)!;
							merged[index] = mergeObjects(merged[index], marketStateReward);
						} else {
							merged.push(marketStateReward);
						}
					});
					return merged;
				},
			},
		},
	},
};

// Apollo InMemoryCache needs to serialize BigInts to JSON, so we need to add a toJSON method to BigInt.prototype.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json
// @ts-ignore
BigInt.prototype.toJSON = function () {
	return this.toString();
};

export const cache = new InMemoryCache({
	typePolicies: mergeTypePolicies(bigIntFieldsTypePolicies, typePolicies),
});
