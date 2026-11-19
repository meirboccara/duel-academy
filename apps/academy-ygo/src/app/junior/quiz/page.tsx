import type { Metadata } from "next";
import { MissionOne } from "@/components/junior/mission-one";

export const metadata: Metadata = { title: "Junior Mission 1 quiz" };

/** The pilot's story-and-quiz mission, kept as an optional extra next to Junior play. */
export default function JuniorQuizPage() {
	return <MissionOne />;
}
