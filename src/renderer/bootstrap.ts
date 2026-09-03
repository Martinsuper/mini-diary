import { BootstrapData } from "../shared/ipc";

let data: BootstrapData;

export function initializeBootstrap(bootstrapData: BootstrapData): void {
	data = bootstrapData;
}

export function getBootstrap(): BootstrapData {
	if (!data) throw Error("Renderer bootstrap data is unavailable");
	return data;
}
