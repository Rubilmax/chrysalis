import type { Address } from "viem";

export const useAddressLabel = (address?: Address) => {
	return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
};
