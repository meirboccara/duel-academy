"use client";

import { Balloon, Bomb, BookOpen, BookOpenText, Brush, Compass, CookingPot, Crosshair, Flag, Flame, FlaskConical, HardHat, Heart, Lamp, Rainbow, Scissors, Shield, ShieldCheck, Shirt, ShoppingBasket, Snowflake, Sparkles, Star, Sword, Swords, Telescope, Umbrella, Wand, WandSparkles, Zap } from "lucide-react";
import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { Avatar } from "@/lib/junior/profiles";
import { CONTROLS_COPY } from "@/lib/junior/world/controls-copy";
import { type Outfit, WARDROBE_SLOTS, type WardrobeItem, type WardrobeSlot, wardrobeFor } from "@/lib/junior/world/wardrobe";
import { bigButton, quietButton } from "../home/confirm-dialog";
import { AvatarPicture } from "../home/avatar-picture";

/** What the shop needs to sell things for the figure and dress it. */
export interface WardrobeActions {
	avatar: Avatar;
	items: readonly string[];
	wear: Outfit;
	onBuy: (id: string) => boolean;
	onWear: (id: string) => void;
	onTakeOff: (slot: WardrobeSlot) => void;
}

const ICONS: Record<string, typeof Shirt> = {
	"hat-helmet": HardHat,
	"hat-wizard": Sparkles,
	"held-sword": Sword,
	"held-big-sword": Swords,
	"held-shield": Shield,
	"held-wand": WandSparkles,
	"held-staff": Wand,
	"held-book": BookOpen,
	"held-crossbow": Crosshair,
	"held-star-wand": Star,
	"held-broom": Brush,
	"held-basket": ShoppingBasket,
	"held-balloon": Balloon,
	"held-flame-sword": Flame,
	"held-holy-shield": ShieldCheck,
	"held-glow-book": BookOpenText,
	"held-ice-staff": Snowflake,
	"held-fire-staff": Flame,
	"held-lightning-staff": Zap,
	"held-dagger": Scissors,
	"held-smoke-bomb": Bomb,
	"held-shadow-daggers": Swords,
	"held-venom-crossbow": FlaskConical,
	"held-heart-wand": Heart,
	"held-rainbow-wand": Rainbow,
	"held-mushroom": Umbrella,
	"held-cauldron": CookingPot,
	"held-sparkle-broom": Sparkles,
	"held-spyglass": Telescope,
	"held-lantern": Lamp,
	"held-compass": Compass,
};
/** A small picture of an item: its colour on a shirt or cape, an icon for the others. */
export function ItemIcon({ item, className = "h-8 w-8" }: { item: WardrobeItem; className?: string }) {
	if (item.colour) {
		/* A dorm's cap is a hat in the dorm's colour. */
		const Icon = item.slot === "shirt" ? Shirt : item.slot === "hat" ? HardHat : Flag;
		return <Icon className={className} style={{ color: item.colour, fill: item.colour }} aria-hidden />;
	}
	const Icon = ICONS[item.id] ?? Sparkles;
	return <Icon className={`${className} text-gold-400`} aria-hidden />;
}

/**
 * The shop's "For your hero" tab: shirts, capes, hats and things to hold, by place. A thing is bought from its large
 * view, then put on or taken off there. `preview` shows the figure wearing an outfit (the 3D figure when it can).
 *
 * Each figure sees only what suits it (`wardrobeFor`): the girls' own things are not offered to the Knight, and no
 * figure is offered the hat it already wears. A thing bought for another figure of the same save is kept, unseen.
 * A gift (the dorm's cap) is listed only once the child owns it: it is never for sale.
 */
export function HeroShop({ stars, wardrobe, locale, first, preview }: { stars: number; wardrobe: WardrobeActions; locale: Locale; first: RefObject<HTMLButtonElement | null>; preview?: (outfit: Outfit) => ReactNode }) {
	const words = CONTROLS_COPY[locale];
	const [picked, setPicked] = useState<string | null>(null);
	const [said, setSaid] = useState<string | null>(null);
	const things = wardrobeFor(wardrobe.avatar, wardrobe.items);
	/* Only a thing on the list can be opened: not one kept for another figure, nor a gift not yet given. */
	const item = picked ? things.find((thing) => thing.id === picked) : undefined;
	const owned = !!item && wardrobe.items.includes(item.id);
	const worn = !!item && wardrobe.wear[item.slot] === item.id;
	/* Buying or putting on swaps the button for the next one: focus moves to it, so it is never lost. */
	const action = useRef<HTMLButtonElement>(null);
	const acted = useRef(false);
	useEffect(() => {
		if (acted.current) action.current?.focus();
		acted.current = false;
	}, [owned, worn]);

	if (item) {
		/* Trying it on: the large view shows the figure with this thing, whether bought or not. */
		const tryOn = { ...wardrobe.wear, [item.slot]: item.id };
		return (
			<div className="space-y-3 text-center">
				<div className="relative mx-auto grid h-48 w-48 place-items-center rounded-2xl border-2 border-gold-400/60 bg-ink-900">
					{preview ? preview(tryOn) : <AvatarPicture avatar={wardrobe.avatar} className="h-40 w-40" />}
					<span className="absolute bottom-2 end-2 rounded-full bg-ink-950/80 p-1.5">
						<ItemIcon item={item} className="h-6 w-6" />
					</span>
				</div>
				<p dir="auto" className="text-lg font-semibold text-fg">
					{item.name[locale]}
				</p>
				{worn ? (
					<button
						ref={action}
						type="button"
						className={quietButton}
						onClick={() => {
							acted.current = true;
							setSaid(null);
							wardrobe.onTakeOff(item.slot);
						}}
					>
						{words.takeOff}
					</button>
				) : owned ? (
					<button
						ref={action}
						type="button"
						className={`${bigButton} bg-gold-400 text-ink-950`}
						onClick={() => {
							acted.current = true;
							setSaid(words.wearing);
							wardrobe.onWear(item.id);
						}}
					>
						{words.putOn}
					</button>
				) : item.price <= stars ? (
					<button
						ref={action}
						type="button"
						className={`${bigButton} bg-gold-400 text-ink-950`}
						onClick={() => {
							acted.current = true;
							if (wardrobe.onBuy(item.id)) setSaid(words.boughtItem(item.name[locale]));
						}}
					>
						{words.buy(item.price)}
					</button>
				) : (
					<p className="font-semibold text-fg-muted">{words.needMore(item.price - stars)}</p>
				)}
				<p role="status" className="min-h-6 font-semibold text-spell">
					{said ?? (worn ? words.wearing : "")}
				</p>
				<div>
					<button
						type="button"
						className={quietButton}
						onClick={() => {
							setSaid(null);
							setPicked(null);
						}}
					>
						{words.back}
					</button>
				</div>
			</div>
		);
	}

	let index = 0;
	return (
		<div className="max-h-[50svh] space-y-3 overflow-y-auto">
			{WARDROBE_SLOTS.filter((slot) => things.some((thing) => thing.slot === slot)).map((slot) => (
				<section key={slot} aria-label={words.slots[slot]} className="space-y-1">
					<h3 className="text-sm font-semibold text-fg-muted">{words.slots[slot]}</h3>
					<ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
						{things.filter((thing) => thing.slot === slot).map((thing) => {
							const owned = wardrobe.items.includes(thing.id);
							const worn = wardrobe.wear[slot] === thing.id;
							const state = worn ? words.wearing : owned ? words.owned : words.price(thing.price);
							const ref = index++ === 0 ? first : undefined;
							return (
								<li key={thing.id}>
									<button
										ref={ref}
										type="button"
										aria-label={`${thing.name[locale]}, ${state}`}
										onClick={() => setPicked(thing.id)}
										className={`flex w-full flex-col items-center gap-1 rounded-lg border-2 p-2 text-center ${worn ? "border-spell bg-spell/15" : owned ? "border-white/40" : thing.price <= stars ? "border-gold-400/70" : "border-white/15 opacity-70"}`}
									>
										<ItemIcon item={thing} />
										<span dir="auto" className="line-clamp-2 text-xs font-semibold leading-tight text-fg">
											{thing.name[locale]}
										</span>
										<span className="text-xs font-bold text-gold-400">{worn || owned ? "✓" : words.price(thing.price)}</span>
									</button>
								</li>
							);
						})}
					</ul>
				</section>
			))}
		</div>
	);
}
