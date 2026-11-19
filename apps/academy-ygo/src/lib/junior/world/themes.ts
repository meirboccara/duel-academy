import type { WorldId } from "@/lib/junior/play/levels";

export type IslandColor = "blue" | "green" | "red" | "yellow";

/**
 * What each island is made of. Landscape and colour only: no Konami creature or character is modelled (official card art appears only on the card panels).
 * Blue is the child's side, red the rival Nox, yellow the legends, green the friendly villages.
 */
export interface IslandTheme {
	color: IslandColor;
	/** The big piece in the middle of the island. */
	landmark: string;
	/** One building next to each stop, taken in turn. */
	buildings: readonly string[];
	/** Small things scattered inside the road loop on the larger islands. */
	village: readonly string[];
}

const homes = ["building_home_A_green", "building_home_B_green", "trees_A_medium", "building_well_green"];

export const THEMES: Record<WorldId, IslandTheme> = {
	wake: { color: "green", landmark: "building_windmill_green", buildings: ["tent", "building_home_A_green", "building_well_green", "building_home_B_green", "building_grain"], village: homes },
	shield: { color: "blue", landmark: "building_castle_blue", buildings: ["building_tower_A_blue", "target", "building_tower_B_blue", "building_home_A_blue", "building_watermill_blue"], village: ["wall_straight", "target", "barrel"] },
	friend: { color: "green", landmark: "building_market_green", buildings: ["building_home_A_green", "building_tavern_green", "building_home_B_green", "building_well_green", "building_home_A_yellow", "building_stage_A", "building_home_A_blue", "building_lumbermill_green"], village: homes },
	magic: { color: "blue", landmark: "building_church_blue", buildings: ["building_tower_B_blue", "building_watermill_blue", "tent", "building_home_A_blue"], village: ["trees_B_medium", "rock_single_A"] },
	puzzles: { color: "yellow", landmark: "building_archeryrange_yellow", buildings: ["building_scaffolding", "building_home_A_yellow", "building_mine_yellow", "building_tower_A_yellow", "wheelbarrow", "resource_lumber", "building_grain", "crate_A_big", "building_home_A_green", "barrel"], village: ["building_home_A_yellow", "trees_A_small", "sack", "building_grain"] },
	tower: { color: "blue", landmark: "building_tower_A_blue", buildings: ["building_tower_B_blue", "tent"], village: [] },
	rival: { color: "red", landmark: "building_castle_red", buildings: ["building_barracks_red"], village: [] },
	reading: { color: "green", landmark: "building_tavern_green", buildings: ["building_home_A_green", "building_market_green", "building_home_B_green", "building_church_blue", "building_home_A_blue", "building_well_green", "building_stage_A", "building_home_A_yellow", "building_lumbermill_green"], village: homes },
	mat: { color: "yellow", landmark: "building_stage_A", buildings: ["building_blacksmith_red", "building_home_A_yellow", "building_grain", "building_mine_yellow", "building_market_green", "crate_A_big", "building_home_A_green"], village: ["barrel", "crate_A_big", "sack", "trees_A_small"] },
	ritual: { color: "red", landmark: "building_tower_B_red", buildings: ["rock_single_C", "building_well_green", "rock_single_A"], village: [] },
	fusion: { color: "blue", landmark: "building_watermill_blue", buildings: ["building_home_A_blue", "building_home_A_red", "building_home_A_yellow"], village: [] },
	synchro: { color: "green", landmark: "building_windmill_green", buildings: ["building_lumbermill_green", "building_home_B_green", "building_windmill_green"], village: [] },
	xyz: { color: "yellow", landmark: "building_mine_yellow", buildings: ["building_tower_A_yellow", "resource_lumber", "building_home_A_yellow", "building_archeryrange_yellow"], village: [] },
	link: { color: "blue", landmark: "building_tower_B_blue", buildings: ["building_tower_A_blue", "building_well_green", "building_home_A_blue"], village: [] },
	pendulum: { color: "red", landmark: "building_tower_A_red", buildings: ["building_tower_A_blue", "building_tower_B_red", "building_tower_B_blue"], village: [] },
	words: { color: "green", landmark: "building_tower_A_yellow", buildings: ["building_home_A_green", "building_home_B_green", "building_well_green", "building_tavern_green", "building_church_blue"], village: [] },
	legends: { color: "yellow", landmark: "building_castle_yellow", buildings: ["building_tower_A_yellow", "building_archeryrange_yellow", "building_mine_yellow"], village: [] },
	final: { color: "blue", landmark: "building_castle_blue", buildings: ["building_stage_A"], village: [] },
};

/** Trees, hills and rocks on the beach ring. Mountains only on the far (north) side, so nothing hides the island. */
export const SHORE = ["trees_A_large", "trees_A_medium", "tree_single_A", "trees_B_medium", "rock_single_A", "hill_single_A", "trees_A_small", "tree_single_B"] as const;
export const FAR_SHORE = ["mountain_A_grass_trees", "hills_A_trees", "trees_B_large", "mountain_B_grass", "hills_B", "mountain_C"] as const;

/** Pieces much smaller than a tile, drawn bigger so a child can see them. */
export const PIECE_SCALE: Record<string, number> = { tent: 1.8, target: 1.8, barrel: 2, crate_A_big: 1.8, sack: 2, wheelbarrow: 1.8, resource_lumber: 1.6, rock_single_A: 1.4, rock_single_C: 1.6, trees_A_small: 1.2 };
