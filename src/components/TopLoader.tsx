"use client";

import LinearProgress from "@mui/material/LinearProgress";
import React from "react";

const speed = 150;
const trickleSpeed = 500;

const isDifferentAnchorOfSameUrl = (currentUrl: URL, newUrl: URL) => {
	// Compare hostname, pathname, and search parameters
	if (
		currentUrl.hostname === newUrl.hostname &&
		currentUrl.pathname === newUrl.pathname &&
		currentUrl.search === newUrl.search
	) {
		// Check if the new URL is just an anchor of the current URL page
		return (
			currentUrl.hash !== newUrl.hash &&
			currentUrl.href.replace(currentUrl.hash, "") ===
				newUrl.href.replace(newUrl.hash, "")
		);
	}

	return false;
};

const TopLoader = () => {
	const [progress, setProgress] = React.useState(0);

	React.useEffect(() => {
		const inc = (amount?: number) => {
			setProgress((progress) => {
				if (amount == null) {
					if (progress >= 0 && progress < 20) amount = 10;
					else if (progress < 50) amount = 4;
					else if (progress < 80) amount = 2;
					else if (progress < 99) amount = 0.5;
					else amount = 0;
				}

				return Math.min(progress + amount, 99.4);
			});
		};

		let timeout: NodeJS.Timeout;
		const start = () => {
			setProgress(8);

			const trickle = () => {
				timeout = setTimeout(
					() => {
						inc();
						trickle();
					},
					trickleSpeed * (Math.random() + 0.5),
				);
			};

			trickle();
		};

		const done = () => {
			clearTimeout(timeout);

			setTimeout(() => inc(30 + 50 * Math.random()), speed);

			setTimeout(() => setProgress(100), speed * 2);

			setTimeout(() => setProgress(0), speed * 2.5);
		};

		/**
		 * Find the closest anchor to trigger
		 * @param element {HTMLElement | null}
		 * @returns element {Element}
		 */
		function findClosestAnchor(
			element: HTMLElement | null,
		): HTMLAnchorElement | null {
			let closest = element;
			while (closest && closest.tagName.toLowerCase() !== "a") {
				closest = closest.parentElement;
			}

			return closest as HTMLAnchorElement;
		}

		/**
		 * Complete TopLoader Progress on adding new entry to history stack
		 * @param {History}
		 * @returns {void}
		 */
		((history: History): void => {
			const pushState = history.pushState;
			history.pushState = (...args) => {
				done();
				return pushState.apply(history, args);
			};
		})((window as Window).history);

		/**
		 * Complete TopLoader Progress on replacing current entry of history stack
		 * @param {History}
		 * @returns {void}
		 */
		((history: History): void => {
			const replaceState = history.replaceState;
			history.replaceState = (...args) => {
				done();
				return replaceState.apply(history, args);
			};
		})((window as Window).history);

		const handleClick = (event: MouseEvent) => {
			try {
				const anchor = findClosestAnchor(event.target as HTMLElement);
				if (anchor?.href) {
					const currentUrl = new URL(
						window.location.href,
						window.location.href,
					);
					const nextUrl = new URL(anchor.href, window.location.href);

					if (window.location.hostname !== nextUrl.hostname) return;

					if (
						isDifferentAnchorOfSameUrl(currentUrl, nextUrl) ||
						anchor.target === "_blank" ||
						event.ctrlKey ||
						event.metaKey ||
						event.shiftKey ||
						event.altKey ||
						!nextUrl.href.startsWith("http")
					) {
						start();
						done();
					} else {
						start();
					}
				}
			} catch (err) {
				start();
				done();
			}
		};

		document.addEventListener("click", handleClick);
		window.addEventListener("pagehide", done);
		window.addEventListener("popstate", done);

		return () => {
			document.removeEventListener("click", handleClick);
			window.removeEventListener("pagehide", done);
			window.removeEventListener("popstate", done);
		};
	}, []);

	return (
		<LinearProgress
			variant="determinate"
			color="primary"
			value={progress}
			sx={{
				position: "absolute",
				top: 0,
				left: 0,
				height: 3,
				width: "100vw",
				transitionDuration: 100,
				display: progress === 0 ? "none" : "inherit",
			}}
		/>
	);
};

export default React.memo(TopLoader);
