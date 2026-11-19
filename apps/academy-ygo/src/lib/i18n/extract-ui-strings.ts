import ts from "typescript";

/** Build-time/test-only inventory of literal t() calls; dynamic inputs need explicit coverage. */
export function extractTranslatedLiterals(source: string): string[] {
	const file = ts.createSourceFile("component.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
	const strings: string[] = [];
	function visit(node: ts.Node) {
		if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "t") {
			const argument = node.arguments[0];
			if (argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) strings.push(argument.text);
		}
		ts.forEachChild(node, visit);
	}
	visit(file);
	return strings;
}
