/** Only prose fields are translated: identifiers, URLs and diagram geometry stay stable. */
export const TEXT_FIELDS = new Set(["title", "description", "audience", "alt", "speakerNotes", "label", "sub", "action", "callout", "note", "footnote", "name", "text", "monsterType", "badge", "lessonTitle", "arrowLabel", "value"]);
const TEXT_ARRAY_FIELDS = new Set(["headings"]);
export type Dictionary = Readonly<Record<string, string>>;
export function localizeData<T>(data: T, dictionary: Dictionary | undefined): T {
	if (!dictionary) return data;
	const translate = (value: string) => Object.hasOwn(dictionary, value) ? dictionary[value]! : value;
	function visit(value: unknown, field = ""): unknown {
		if (typeof value === "string") return TEXT_FIELDS.has(field) || TEXT_ARRAY_FIELDS.has(field) ? translate(value) : value;
		if (Array.isArray(value)) return value.map((item) => visit(item, field));
		if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item, key)]));
		return value;
	}
	return visit(data) as T;
}
