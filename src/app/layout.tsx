import NavBar from "@/components/NavBar";
import type { Metadata, Viewport } from "next";
import type React from "react";

import "evm-maths";
import "react-toastify/dist/ReactToastify.min.css";
import "./globals.css";
import SideBar from "@/components/SideBar";
import TopLoader from "@/components/TopLoader";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { Providers } from "./providers";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export const metadata: Metadata = {
	title: {
		template: "%s | Chrysalis",
		default: "Chrysalis",
	},
	manifest: "/manifest.json",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
	return (
		<html lang="en">
			<body>
				<Providers>
					<NavBar />

					<Stack
						direction="row"
						justifyContent="space-between"
						flexWrap="wrap"
						position="relative"
					>
						<TopLoader />
						<Stack flex={3} mt={10}>
							<Container maxWidth="md">{children}</Container>
						</Stack>
						<SideBar />
					</Stack>
				</Providers>
			</body>
		</html>
	);
}
