let counter = 0;
let queue = Promise.resolve();

/** Render diagram nodes serially using Mermaid's strict, non-interactive security mode. */
export function renderDiagrams(container: HTMLElement, dark = false): Promise<void> {
	queue = queue
		.catch(() => undefined)
		.then(async () => {
			const nodes = [...container.querySelectorAll<HTMLElement>("[data-diagram]")];
			if (!nodes.length) return;
			const { default: mermaid } = await import("mermaid");
			mermaid.initialize({
				startOnLoad: false,
				securityLevel: "strict",
				theme: dark ? "dark" : "default",
				flowchart: { htmlLabels: false },
			});
			for (const node of nodes) {
				try {
					counter += 1;
					const { svg } = await mermaid.render(
						`dayleaf-diagram-${counter}`,
						node.textContent || "",
					);
					// Mermaid sanitizes the SVG in strict mode; user HTML is never enabled.
					node.innerHTML = svg;
					node.removeAttribute("data-diagram");
				} catch (_) {
					node.setAttribute("role", "note");
				}
			}
		});
	return queue;
}
