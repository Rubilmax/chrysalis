import type { Metadata } from "next";
import { type ReactNode } from "react";

import "evm-maths";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "Chrysalis",
	manifest: "/manifest.json",
};

export default function RootLayout(props: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>
				<Providers>{props.children}</Providers>
			</body>
		</html>
	);
}
