import DataLink from "@/components/DataLink";
import { createToast, updateToast } from "@/toast";
import { getDefaultConfig } from "connectkit";
import React from "react";
import { Id } from "react-toastify";
import { createConfig } from "wagmi";
import {
	Config,
	ResolvedRegister,
	UseDeployContractParameters,
	UseDeployContractReturnType,
	UseSendTransactionParameters,
	UseSendTransactionReturnType,
	useAccount,
	useDeployContract as useWagmiDeployContract,
	useSendTransaction as useWagmiSendTransaction,
	useWaitForTransactionReceipt as useWagmiWaitForTransactionReceipt,
} from "wagmi";
import { base, mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, safe } from "wagmi/connectors";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;
const appLogoUrl = "https://rubilmax.github.io/chrysalis/chrysalis.png";

export const config = createConfig(
	getDefaultConfig({
		walletConnectProjectId,
		chains: [mainnet, sepolia, base],
		connectors: [
			injected(),
			coinbaseWallet({ appName: "Chrysalis", appLogoUrl }),
			safe(),
		],
		ssr: true,
		appName: "Chrysalis",
		appDescription: "Minimalist widget for Morpho Blue",
		appUrl: "https://rubilmax.github.io/chrysalis/",
		appIcon: appLogoUrl, // no bigger than 1024x1024px (max. 1MB)
	}),
);

export const useSendTransaction = <
	config extends Config = ResolvedRegister["config"],
	context = unknown,
>(
	parameters: UseSendTransactionParameters<config, context> = {},
) => {
	const request = useWagmiSendTransaction(parameters);

	const receipt = useTransactionToast(request);

	return { request, receipt };
};

export const useDeployContract = <
	config extends Config = ResolvedRegister["config"],
	context = unknown,
>(
	parameters: UseDeployContractParameters<config, context> = {},
) => {
	const request = useWagmiDeployContract(parameters);

	const receipt = useTransactionToast(request);

	return { request, receipt };
};

export const useTransactionToast = <
	config extends Config = ResolvedRegister["config"],
	context = unknown,
>(
	request:
		| UseDeployContractReturnType<config, context>
		| UseSendTransactionReturnType<config, context>,
) => {
	const toastId = React.useRef<Id>();
	const account = useAccount();

	const receipt = useWagmiWaitForTransactionReceipt({ hash: request.data });

	// Request

	React.useEffect(() => {
		if (!request.isPending) return;

		toastId.current = createToast(`Waiting for signature...`, {
			type: "default",
			isLoading: true,
		});
	}, [toastId, request.isPending]);

	React.useEffect(() => {
		if (toastId.current == null || !request.isIdle) return;

		updateToast(toastId.current, {
			type: "default",
			isLoading: false,
			render: `Transaction cancelled`,
			autoClose: 2500,
		});
	}, [toastId, request.isIdle]);

	React.useEffect(() => {
		if (toastId.current == null || !request.isError) return;

		console.error(request.error);

		updateToast(toastId.current, {
			type: "error",
			isLoading: false,
			render: `An error occurred while requesting signature: ${request.error.message.split("\n")[0]}`,
			autoClose: 5000,
		});
	}, [toastId, request.isError, request.error]);

	React.useEffect(() => {
		if (toastId.current == null || !request.isSuccess) return;

		updateToast(toastId.current, {
			type: "success",
			isLoading: true,
			render: (
				<>
					Transaction submitted with hash:{" "}
					<DataLink
						data={request.data}
						type="tx"
						variant="body2"
						fontWeight={500}
					/>
				</>
			),
		});
	}, [toastId, request.isSuccess]);

	// Receipt

	React.useEffect(() => {
		if (toastId.current == null || !receipt.isError) return;

		console.error(receipt.error);

		updateToast(toastId.current, {
			type: "error",
			isLoading: false,
			render: `An error occurred while deploying the contract: ${receipt.error.message.split("\n")[0]}`,
			autoClose: 5000,
		});
	}, [toastId, receipt.isError, receipt.error]);

	React.useEffect(() => {
		if (toastId.current == null || !receipt.isSuccess) return;

		updateToast(toastId.current, {
			type: "success",
			isLoading: false,
			render: (
				<>
					Transaction included at block #{receipt.data.blockNumber} with hash:{" "}
					{
						<DataLink
							data={receipt.data.transactionHash}
							type="tx"
							variant="body2"
							fontWeight={500}
						/>
					}
				</>
			),
			autoClose: 5000,
		});
	}, [
		toastId,
		receipt.isSuccess,
		receipt.data?.blockNumber,
		receipt.data?.transactionHash,
	]);

	return receipt;
};

declare module "wagmi" {
	interface Register {
		config: typeof config;
	}
}