import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { memo, useCallback } from "react";
import { useAccount } from "wagmi";

const DataLink = ({ data, type }: { data: string; type: "address" | "tx" }) => {
	const account = useAccount();

	const copyToClipboard = useCallback(
		async (event: React.MouseEvent) => {
			event.stopPropagation();

			await navigator.clipboard.writeText(data);
		},
		[data],
	);

	const explorerUrl = account.chain?.blockExplorers?.default.url;

	return (
		<>
			<Typography
				variant="body2"
				component="a"
				href={
					explorerUrl && new URL(`/${type}/${data}`, explorerUrl).toString()
				}
				target="_blank"
				rel="noopener noreferrer"
				noWrap
			>
				{data.substring(0, 6)}...{data.substring(data.length - 4)}
				{explorerUrl && (
					<OpenInNewIcon fontSize="inherit" sx={{ marginLeft: 0.5 }} />
				)}
			</Typography>
			<IconButton sx={{ fontSize: 16, marginLeft: 1 }}>
				<ContentCopyIcon fontSize="inherit" onClick={copyToClipboard} />
			</IconButton>
		</>
	);
};

export default memo(DataLink);
