import NavBar from "@/components/NavBar";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "evm-maths";
import "react-toastify/dist/ReactToastify.min.css";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
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

					<Stack
						direction="row"
						justifyContent="space-between"
						flexWrap="wrap"
						mt={4}
					>
						<Stack flex={3}>
							<Container maxWidth="md">{props.children}</Container>
						</Stack>
						<Sidebar />
					</Stack>
				</Providers>
			</body>
		</html>
	);
}
