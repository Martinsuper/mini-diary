import path from "path";

import LicenseCheckerWebpackPlugin from "license-checker-webpack-plugin";
import { CliConfigOptions, Configuration } from "webpack";

export default (
	_: string | Record<string, boolean | number | string>,
	args: CliConfigOptions,
): Configuration => {
	const configName = args.config?.split(".")[2];
	return {
		devtool: args.mode === "production" ? false : "source-map",
		mode: args.mode === "production" ? "production" : "development",
		module: {
			rules: [
				{
					exclude: /node_modules/,
					test: /\.[jt]sx?$/,
					use: "babel-loader",
				},
			],
		},
		output: {
			clean: false,
			path: path.resolve(__dirname, "bundle"),
		},
		plugins:
			args.mode === "production"
				? [
						new LicenseCheckerWebpackPlugin({
							allow: "(Apache-2.0 OR BSD-2-Clause OR BSD-3-Clause OR ISC OR MIT OR Zlib)",
							outputFilename: `licenses-${configName}.txt`,
						}),
				  ]
				: [],
		resolve: {
			extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
		},
	};
};
