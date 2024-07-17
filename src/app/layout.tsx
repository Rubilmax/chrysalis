import NavBar from "@/components/NavBar";
import type { Metadata, Viewport } from "next";
import type React from "react";

import "evm-maths";
import "react-toastify/dist/ReactToastify.min.css";
import "./globals.css";
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
		template: "%s | Ninja Blue",
		default: "Ninja Blue | Leverage",
	},
	manifest: "/manifest.json",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
	return (
		<html lang="en">
			<body>
				<Providers>
					<NavBar />

					<video
						src="/abstract-shape.webm"
						height="80%"
						style={{
							position: "fixed",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							opacity: 0.8,
						}}
						autoPlay
						muted
						loop
					/>

					<Stack
						direction="row"
						justifyContent="space-between"
						flexWrap="wrap"
						position="relative"
					>
						<TopLoader />
						<Stack flex={3} mt={10} mb={10}>
							<Container maxWidth="md">{children}</Container>
						</Stack>
					</Stack>
				</Providers>
			</body>
		</html>
	);
}
