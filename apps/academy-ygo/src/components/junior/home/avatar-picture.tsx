"use client";

import { useState } from "react";
import type { Avatar } from "@/lib/junior/profiles";

const FALLBACK: Record<Avatar, string> = { knight: "🛡️", mage: "🧙", rogue: "🧝", star: "🌟", witch: "🧙‍♀️", explorer: "🎒" };

/** The still picture of a chosen character (`public/world/hero-<avatar>.webp`); an emoji until the picture loads or if it is missing. */
export function AvatarPicture({ avatar, className = "h-16 w-16", alt = "" }: { avatar: Avatar; className?: string; alt?: string }) {
	const [failed, setFailed] = useState(false);
	if (failed)
		return (
			<span role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true} className={`grid place-items-center text-3xl ${className}`}>
				{FALLBACK[avatar]}
			</span>
		);
	return <img src={`/world/hero-${avatar}.webp`} alt={alt} width={512} height={512} decoding="async" draggable={false} onError={() => setFailed(true)} className={`object-contain ${className}`} />;
}
