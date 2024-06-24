import Alert, { type AlertColor } from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import type React from "react";
import type { ReactNode } from "react";

import {
	type Id,
	type ToastOptions,
	type UpdateOptions,
	toast as reactToastify,
} from "react-toastify";

export function createToast(content: ReactNode, options?: ToastOptions<never>) {
	const severity =
		options?.type === "default" ? "info" : options?.type || "info";

	return reactToastify(
		({ closeToast }) => (
			<Alert
				severity={severity}
				onClose={closeToast}
				icon={
					options?.isLoading ? (
						<CircularProgress
							variant="indeterminate"
							color="inherit"
							size={20}
						/>
					) : undefined
				}
			>
				{content}
			</Alert>
		),
		{ ...options, data: { severity, content } },
	);
}

export function updateToast(
	id: Id,
	{ render, ...options }: UpdateOptions<never> & { render?: ReactNode },
) {
	reactToastify.update<{
		severity: AlertColor;
		content: React.ReactNode;
	}>(id, {
		...options,
		render: ({ data, closeToast }) => (
			<Alert
				severity={
					options.type === "default" ? "info" : options.type || data.severity
				}
				onClose={closeToast}
			>
				{render ?? data.content}
			</Alert>
		),
	});
}
