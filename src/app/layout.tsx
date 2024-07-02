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
		template: "%s | Chrysalis",
		default: "Chrysalis",
	},
	manifest: "/manifest.json",
};

const backgrounds = new Array(10).fill(undefined).map((_, i) => ({
	opacity: 0,
	background: `url(/backgrounds/${i + 1}.png) no-repeat 50% 50%`,
	animation: `background-fade-in-out 40s linear ${(i + 1) * 1.5}s forwards infinite`,
}));

export default function RootLayout({ children }: React.PropsWithChildren) {
	return (
		<html lang="en">
			<body>
				<Providers>
					<NavBar />

					{backgrounds.map((bg) => (
						<Stack
							key={bg.background}
							position="fixed"
							top={0}
							left={0}
							height="100vh"
							width="100vw"
							zIndex={0}
							sx={bg}
						/>
					))}

					<Stack
						direction="row"
						justifyContent="space-between"
						flexWrap="wrap"
						position="relative"
						zIndex={1}
					>
						<TopLoader />
						<Stack flex={3} mt={10}>
							<Container maxWidth="md">{children}</Container>
						</Stack>
					</Stack>
				</Providers>
			</body>
		</html>
	);
}
