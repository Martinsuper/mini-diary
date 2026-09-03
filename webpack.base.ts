import path from "path";

import { Configuration } from "webpack";

export default (
	_: string | Record<string, boolean | number | string>,
	args: { mode?: string },
): Configuration => ({
	devtool: args.mode === "production" ? false : "source-map",
	mode: args.mode === "production" ? "production" : "development",
	module: {
		rules: [
			{
				exclude: /node_modules/,
				test: /\.[jt]sx?$/,
				use: {
					loader: "ts-loader",
					options: { compilerOptions: { module: "esnext" }, transpileOnly: true },
				},
			},
		],
	},
	output: {
		clean: false,
		path: path.resolve(__dirname, "bundle"),
	},
	resolve: {
		extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
	},
});
