import { InMemoryCache } from "@apollo/client";

import { typePolicies } from "@morpho-org/blue-api-sdk";

// Apollo InMemoryCache needs to serialize BigInts to JSON, so we need to add a toJSON method to BigInt.prototype.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json
// @ts-ignore
BigInt.prototype.toJSON = function () {
	return this.toString();
};

export const cache = new InMemoryCache({ typePolicies });
