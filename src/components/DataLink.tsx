import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography, { type TypographyOwnProps } from "@mui/material/Typography";
import React from "react";
import { getAddress } from "viem";
import { useAccount, useEnsName } from "wagmi";

export interface DataLinkProps extends TypographyOwnProps {
	data: string;
	type?: "address" | "tx";
}

const DataLink = ({ data, type, ...props }: DataLinkProps) => {
	const account = useAccount();

	const copyToClipboard = React.useCallback(
		async (event: React.MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();

			await navigator.clipboard.writeText(data);
		},
		[data],
	);

	const dataLabel = React.useMemo(
		() => `${data.slice(0, 6)}...${data.slice(-4)}`,
		[data],
	);
	const explorerUrl = account.chain?.blockExplorers?.default.url;

	const { data: ens } = useEnsName({
		address: type === "address" ? getAddress(data) : undefined,
	});

	if (!type || !explorerUrl)
		return (
			<>
				<Typography {...props} noWrap>
					{ens ?? dataLabel}
				</Typography>
				<IconButton
					sx={{ fontSize: 12, padding: 0.4, marginLeft: 0.6, borderRadius: 1 }}
				>
					<ContentCopyIcon fontSize="inherit" onClick={copyToClipboard} />
				</IconButton>
			</>
		);

	return (
		<Stack direction="row" alignItems="center">
			<Typography
				color="inherit"
				fontSize="inherit"
				fontWeight={500}
				{...props}
				component="a"
				href={
					explorerUrl && new URL(`/${type}/${data}`, explorerUrl).toString()
				}
				target="_blank"
				rel="noopener noreferrer"
				sx={{ verticalAlign: "middle" }}
				onClick={(event) => {
					event.stopPropagation();
				}}
				noWrap
			>
				{ens ?? dataLabel}
				<OpenInNewIcon sx={{ fontSize: 12, marginLeft: 0.4 }} />
			</Typography>
			<IconButton
				color="inherit"
				sx={{ fontSize: 12, padding: 0.4, marginLeft: 0.6, borderRadius: 1 }}
			>
				<ContentCopyIcon fontSize="inherit" onClick={copyToClipboard} />
			</IconButton>
		</Stack>
	);
};

export default React.memo(DataLink);
