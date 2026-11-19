import type { Metadata, Viewport } from "next";
import { Cinzel, Heebo, Source_Sans_3 } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { LanguageProvider } from "@/lib/i18n/provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans", display: "swap" });
/* Cinzel and Source Sans have no Hebrew glyphs: Heebo covers Hebrew (and Latin) when the page is in Hebrew. */
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });

export const metadata: Metadata = {
	title: { default: `${APP_NAME} — ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
	description: APP_DESCRIPTION,
};

export const viewport: Viewport = {
	themeColor: "#05070f",
	colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning className={`${cinzel.variable} ${sourceSans.variable} ${heebo.variable}`}>
			<body>
				<LanguageProvider>
					<SiteHeader />
					{children}
					<SiteFooter />
				</LanguageProvider>
			</body>
		</html>
	);
}
