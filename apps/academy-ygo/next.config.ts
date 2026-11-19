import path from "node:path";

import type { NextConfig } from "next";

const config: NextConfig = {
	poweredByHeader: false,
	reactStrictMode: true,
	devIndicators: false,
	/*
	 * The site is for children only. Junior play moved to the home page, and the beginner course for teens and
	 * adults is no longer offered: its old addresses lead home. Temporary (307), so browsers do not keep them.
	 */
	async redirects() {
		return [
			{ source: "/junior", destination: "/", permanent: false },
			{ source: "/academy/:path*", destination: "/", permanent: false },
		];
	},
	/*
	 * Card pictures never change under the same name (the size and the card's picture id are in the name), so browsers
	 * may keep them for a year instead of asking again on every visit. The icons keep fixed names: one day.
	 */
	async headers() {
		const forever = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
		return [
			{ source: "/cards/:path*", headers: forever },
			{ source: "/icons/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
		];
	},
	turbopack: {
		// pnpm workspace: dependencies are symlinks into the repo-root store.
		root: path.join(__dirname, "..", ".."),
	},
};

export default config;
