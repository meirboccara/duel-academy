import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";

/**
 * Lets a parent add the game to an iPad's or iPhone's Home Screen (Share, then Add to Home Screen). WebKit gives a
 * Home Screen web app its own count of days of use, so Safari's seven-day rule does not wipe the children's saves.
 */
export default function manifest(): MetadataRoute.Manifest {
	return {
		name: APP_NAME,
		short_name: APP_NAME,
		description: APP_DESCRIPTION,
		start_url: "/",
		display: "standalone",
		background_color: "#05070f",
		theme_color: "#05070f",
		icons: [
			{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
			{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
			{ src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
		],
	};
}
