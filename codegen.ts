import type { CodegenConfig } from "@graphql-codegen/cli";

const avoidOptionals = {
	field: true,
	inputValue: false,
	defaultValue: true,
};

const scalars = {
	BigInt: {
		input: "string | bigint | number",
		output: "bigint",
	},
	HexString: {
		input: "viem#Hex",
		output: "viem#Hex",
	},
	Address: {
		input: "viem#Address",
		output: "viem#Address",
	},
	MarketId: {
		input: "viem#Hash",
		output: "viem#Hash",
	},
};

const config: CodegenConfig = {
	overwrite: true,

	schema: "https://blue-api.morpho.org/graphql",
	documents: ["src/graphql/*.query.gql", "src/graphql/*.fragment.gql"],
	generates: {
		"src/graphql/types.ts": {
			plugins: ["typescript"],
			config: {
				avoidOptionals,
				scalars,
			},
		},
		"src/graphql/": {
			preset: "near-operation-file",
			plugins: ["typescript-operations", "typescript-react-apollo"],
			presetConfig: {
				baseTypesPath: "types.ts",
			},
			config: {
				avoidOptionals,
				scalars: {
					BigInt: {
						input: "Types.Scalars['BigInt']['input']",
						output: "Types.Scalars['BigInt']['output']",
					},
					HexString: {
						input: "Types.Scalars['HexString']['input']",
						output: "Types.Scalars['HexString']['output']",
					},
					Address: {
						input: "Types.Scalars['Address']['input']",
						output: "Types.Scalars['Address']['output']",
					},
					MarketId: {
						input: "Types.Scalars['MarketId']['input']",
						output: "Types.Scalars['MarketId']['output']",
					},
				},
			},
		},
	},
};

export default config;
