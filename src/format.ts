import { type Address, parseUnits } from "viem";

export const useAddressLabel = (address?: Address) => {
	return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
};

export const parseNumber = (value: number, decimals = 18) =>
	parseUnits(value.toFixed(decimals), decimals);
