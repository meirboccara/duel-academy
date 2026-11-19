# Academy French terminology

The French curriculum follows Konami terminology where verified. This is an educational adaptation, not an official translation or an endorsement by Konami. Invented cards retain their invented identities and mechanics. Hebrew remains an unofficial educational translation: no official Hebrew card database was found.

## Verified sources and choices

- [Polymérisation](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=4837&request_locale=fr): « Invoquez par Fusion 1 Monstre Fusion depuis votre Extra Deck, en utilisant des monstres depuis votre main ou Terrain. » Related card text on that page uses **Matériel / Matériels**, not matériau/matériaux.
- [Le Créateur](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=6176&request_locale=fr): **Une fois par tour**, **cibler**, **Cimetière**, **Invoquez Spécialement**.
- [Syntonisation de Combat](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=7742&request_locale=fr): **Jeu-Rapide**, **Syntoniseur**. Its old « Retirez du jeu » wording is not the modern terminology to teach.
- [Consécration par la Lumière et les Ténèbres](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=5907&request_locale=fr): **Sacrifiez**; related modern cards on the page use **Bannissez / bannir**.
- [Roue Synchronique](https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=18788&request_locale=fr): **Matériel Synchro**, **Syntoniseur**, **Invocation Synchro / Invoquer par Synchronisation**. Card text on this page also preserves **Main Phase, Battle Phase, Standby Phase, Damage Step**.
- [French official rulebook v8, third-party mirror](https://fr.readkong.com/page/livret-de-regles-officiel-version-8-0-2399255): **Spell Speed**, **Draw Phase**, **End Phase**. These three choices rely on an older rulebook mirror, not a freshly verified modern Konami-hosted extract.
- [Konami-hosted v9 PDF](https://img.yugioh-card.com/eu/wp-content/uploads/2022/07/Rulebook_v9_fr.pdf): retrieved, but text extraction failed. It is not claimed as independently checked evidence.

## Boundaries

Only French values change: English lookup keys, card statistics, effect mechanics, identifiers and progress are unchanged. This is a focused terminology audit, not a native-speaker proofread of the 2,106 lesson strings in `fr-content.json` or of the interface strings in `ui-fr.ts`. Known remaining gaps: sentences that mix French "Étape de Bataille" with English "Damage Step", and French articles before English phase names ("la Damage Step"), which follow the English names the French database keeps but were not checked against a Konami sentence. Unverified terms such as Classification Lien, Pendulation and the translated names of invented cards remain as before. Literal effect text of a real card should be looked up by its stable database identity; this change does not substitute real-card effects for schematic teaching examples.

`src/lib/i18n/terminology-fr.test.ts` guards the audited term families; the existing dictionary-coverage tests guard missing entries. Neither proves sentence-level translation correctness.
