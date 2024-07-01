/** @type {import('next').NextConfig} */
const nextConfig = {
	images: { unoptimized: true },
};

if (process.env.NODE_ENV === "development") {
	nextConfig.headers = () => [
		{
			source: "/manifest.json",
			headers: [
				{ key: "Access-Control-Allow-Origin", value: "*" },
				{ key: "Access-Control-Allow-Methods", value: "GET" },
				{
					key: "Access-Control-Allow-Headers",
					value: "X-Requested-With, content-type, Authorization",
				},
			],
		},
	];
}

module.exports = nextConfig;
