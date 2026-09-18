import { renderMarkdownPreview } from "./utils/markdownExtras";
import { renderDiagrams } from "./utils/renderDiagrams";

/** Render the same safe document model for PDF, waiting for diagrams, fonts and images. */
async function renderPrint(markdown: string): Promise<void> {
	document.body.innerHTML = renderMarkdownPreview(markdown);
	const style = document.createElement("style");
	style.textContent =
		"body{font:14px/1.7 sans-serif;color:#202124;margin:32px}img,svg{max-width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f5f7fa;padding:12px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #777;padding:8px}thead{display:table-header-group}tr,img,pre{break-inside:avoid}h1,h2,h3{break-after:avoid}a{color:#155db6}math{font-size:1.2em}";
	document.head.appendChild(style);
	await renderDiagrams(document.body);
	await document.fonts.ready;
	await Promise.all(
		[...document.images].map((image) =>
			Promise.race([
				image.decode().catch(() => {
					image.replaceWith(document.createTextNode(image.alt || "Image unavailable"));
				}),
				new Promise<void>((resolve) =>
					setTimeout(() => {
						if (!image.complete)
							image.replaceWith(document.createTextNode(image.alt || "Image unavailable"));
						resolve();
					}, 5000),
				),
			]),
		),
	);
}

(window as unknown as { renderPrint: typeof renderPrint }).renderPrint = renderPrint;
