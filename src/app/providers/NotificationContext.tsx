import DataLink from "@/components/DataLink";
import { createToast, updateToast } from "@/toast";
import React, { type ReactNode, createContext, useEffect, useRef } from "react";
import { Id } from "react-toastify";
import {
	Config,
	ResolvedRegister,
	UseDeployContractParameters,
	UseSendTransactionParameters,
	useAccount,
	useDeployContract as useWagmiDeployContract,
	useSendTransaction as useWagmiSendTransaction,
	useWaitForTransactionReceipt as useWagmiWaitForTransactionReceipt,
} from "wagmi";

export const NotificationContext = createContext<{}>({});

export const useSendTransaction = <
	config extends Config = ResolvedRegister["config"],
	context = unknown,
>(
	parameters: UseSendTransactionParameters<config, context> = {},
) => {
	const res = useWagmiSendTransaction(parameters);

	console.log(res.data);
	console.log(res.status);
	console.log(res.error);

	// useEffect(() => {
	// 	if (hash) toast.
	// }, [sendStatus]);

	// useEffect(() => {
	// 	switch (res.status) {
	// 		case "error":
	// 			toast.error(res.error.message);
	// 			break;
	// 		case "pending":
	// 			if (res.data)
	// 				updateToast(res.data, { isLoading: true, type: "default" });
	// 			break;
	// 		case "success":
	// 			if (res.data)
	// 				updateToast(res.data, { isLoading: true, type: "default" });
	// 			break;
	// 		default:
	// 			break;
	// 	}
	// }, [res.status, res.error]);

	return res;
};

export const useDeployContract = <
	config extends Config = ResolvedRegister["config"],
	context = unknown,
>(
	parameters: UseDeployContractParameters<config, context> = {},
) => {
	const toastId = useRef<Id>();
	const account = useAccount();

	const request = useWagmiDeployContract(parameters);
	const receipt = useWagmiWaitForTransactionReceipt({ hash: request.data });

	// Request

	useEffect(() => {
		if (!request.isPending) return;

		toastId.current = createToast(`Waiting for signature...`, {
			type: "default",
			isLoading: true,
		});
	}, [toastId, request.isPending]);

	useEffect(() => {
		if (toastId.current == null || !request.isIdle) return;

		updateToast(toastId.current, {
			type: "default",
			isLoading: false,
			render: `Transaction cancelled`,
			autoClose: 2500,
		});
	}, [toastId, request.isIdle]);

	useEffect(() => {
		if (toastId.current == null || !request.isError) return;

		console.error(request.error);

		updateToast(toastId.current, {
			type: "error",
			isLoading: false,
			render: `An error occurred while requesting signature: ${request.error.message.split("\n")[0]}`,
			autoClose: 5000,
		});
	}, [toastId, request.isError, request.error]);

	useEffect(() => {
		if (toastId.current == null || !request.isSuccess) return;

		const explorerUrl = account.chain?.blockExplorers?.default.url;

		updateToast(toastId.current, {
			type: "success",
			isLoading: true,
			render: (
				<>
					Transaction submitted with hash:{" "}
					<DataLink data={request.data} type="tx" />
				</>
			),
		});
	}, [toastId, account.chain?.blockExplorers?.default.url, request.isSuccess]);

	// Receipt

	useEffect(() => {
		if (toastId.current == null || !receipt.isError) return;

		console.error(receipt.error);

		updateToast(toastId.current, {
			type: "error",
			isLoading: false,
			render: `An error occurred while deploying the contract: ${receipt.error.message.split("\n")[0]}`,
			autoClose: 5000,
		});
	}, [toastId, receipt.isError, receipt.error]);

	useEffect(() => {
		if (toastId.current == null || !receipt.isSuccess) return;

		const explorerUrl = account.chain?.blockExplorers?.default.url;

		updateToast(toastId.current, {
			type: "success",
			isLoading: false,
			render: (
				<>
					Transaction included at block #{receipt.data.blockNumber} with hash:{" "}
					{<DataLink data={receipt.data.transactionHash} type="tx" />}
				</>
			),
			autoClose: 5000,
		});
	}, [
		toastId,
		account.chain?.blockExplorers?.default.url,
		receipt.isSuccess,
		receipt.data?.blockNumber,
		receipt.data?.transactionHash,
	]);

	return { request, receipt };
};

export const NotificationContextProvider = ({
	children,
}: { children: ReactNode }) => {
	return (
		<NotificationContext.Provider value={{}}>
			{children}
		</NotificationContext.Provider>
	);
};
