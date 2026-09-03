export function initLogger(): void {
	if (typeof window === "undefined") {
		return;
	}
	window.addEventListener("error", event => {
		console.error(event.error);
	});
	window.addEventListener("unhandledrejection", event => {
		console.error(event.reason);
	});
}
