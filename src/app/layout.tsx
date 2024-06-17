import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { type ReactNode } from "react";

import "evm-maths";
import "./globals.css";
import Head from "next/head";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Chrysalis",
};

export default function RootLayout(props: { children: ReactNode }) {
	return (
		<html lang="en">
			<Head>
				<link rel="manifest" href="/manifest.json" />
			</Head>
			<body className={inter.className}>
				<Providers>{props.children}</Providers>
			</body>
		</html>
	);
}
