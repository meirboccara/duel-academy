import type { Metadata } from "next";
import { JuniorPlay } from "@/components/junior/play/junior-play";

export const metadata: Metadata = { title: "Junior: learn by playing" };

export default function JuniorPage() {
	return <JuniorPlay />;
}
