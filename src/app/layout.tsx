import NavBar from "@/components/NavBar";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "evm-maths";
import "react-toastify/dist/ReactToastify.min.css";
import "./globals.css";
import Container from "@mui/material/Container";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "Chrysalis",
	manifest: "/manifest.json",
};

export default function RootLayout(props: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>
				<Providers>
					<NavBar />

					<Container maxWidth="lg">{props.children}</Container>
				</Providers>
			</body>
		</html>
	);
}
