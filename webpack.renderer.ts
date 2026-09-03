import path from "path";

import HtmlWebpackPlugin from "html-webpack-plugin";
import { Configuration } from "webpack";
import { merge } from "webpack-merge";

import pkg from "./package.json";
import base from "./webpack.base";

export default (
	env: string | Record<string, boolean | number | string>,
	args: { mode?: string },
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
			new HtmlWebpackPlugin({
					title: pkg.productName,
					meta: {
						"Content-Security-Policy": {
							"http-equiv": "Content-Security-Policy",
							content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:",
						},
					},
				}),
		],
		resolve: {
			alias: {
				"moment-timezone$": path.resolve(__dirname, "node_modules/moment-timezone/builds/moment-timezone-with-data-10-year-range.js"),
			},
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
