import { Configuration } from "webpack";
import { merge } from "webpack-merge";

import base from "./webpack.base";

export default (
	env: string | Record<string, boolean | number | string>,
	args: { mode?: string },
): Configuration =>
	merge(base(env, args), {
		entry: "./src/main/main.ts",
		output: {
			filename: "main.js",
		},
		target: "electron-main",
	});
