import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./test/ui",
	forbidOnly: Boolean(process.env.CI),
	fullyParallel: false,
	reporter: process.env.CI ? "github" : "list",
	timeout: 30_000,
	use: {
		trace: "retain-on-failure",
	},
});
