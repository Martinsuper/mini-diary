import HtmlWebpackPlugin from "html-webpack-plugin";
import { CliConfigOptions, Configuration } from "webpack";
import { merge } from "webpack-merge";

import pkg from "./package.json";
import base from "./webpack.base";

export default (
	env: string | Record<string, boolean | number | string>,
	args: CliConfigOptions,
): Configuration =>
	merge(base(env, args), {
		entry: "./src/renderer/renderer.tsx",
		module: {
			rules: [
				{
					test: /\.s?css$/,
					use: ["style-loader", "css-loader", "sass-loader"],
				},
				{
					test: /\.svg$/,
					use: {
						loader: "@svgr/webpack",
						options: { titleProp: true },
					},
				},
				{
					test: /\.(png|jpe?g|gif)$/i,
					type: "asset/resource",
				},
			],
		},
		output: {
			filename: "renderer.js",
		},
		plugins: [
			new HtmlWebpackPlugin({ title: pkg.productName }),
		],
		resolve: {
			fallback: {
				assert: false,
				buffer: false,
				crypto: false,
				fs: false,
				path: false,
			},
		},
		target: "web",
	});
