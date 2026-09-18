import path from "path";

import HtmlWebpackPlugin from "html-webpack-plugin";
import { Configuration, ContextReplacementPlugin } from "webpack";
import { merge } from "webpack-merge";

import pkg from "./package.json";
import base from "./webpack.base";

export default (
	env: string | Record<string, boolean | number | string>,
	args: { mode?: string },
): Configuration =>
	merge(base(env, args), {
		entry: { renderer: "./src/renderer/renderer.tsx", print: "./src/renderer/print.ts" },
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
			filename: "[name].js",
		},
		// Electron loads local assets; these budgets still flag unusually large generated chunks.
		performance: { maxAssetSize: 600_000, maxEntrypointSize: 600_000 },
		plugins: [
			new ContextReplacementPlugin(/moment[/\\]locale$/, /en|zh-cn|zh-tw/),
			new HtmlWebpackPlugin({
				chunks: ["renderer"],
				title: pkg.productName,
				meta: {
					"Content-Security-Policy": {
						"http-equiv": "Content-Security-Policy",
						content:
							"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:",
					},
				},
			}),
			new HtmlWebpackPlugin({
				filename: "print.html",
				chunks: ["print"],
				title: "Dayleaf",
				meta: {
					"Content-Security-Policy": {
						"http-equiv": "Content-Security-Policy",
						content:
							"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:",
					},
				},
			}),
		],
		resolve: {
			alias: {
				"moment-timezone$": path.resolve(
					__dirname,
					"node_modules/moment-timezone/builds/moment-timezone-with-data-10-year-range.js",
				),
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
