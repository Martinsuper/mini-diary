import { addIndexDoc, createIndex, searchIndex } from "../src/renderer/utils/searchIndex";

test("indexes the first entry and finds Chinese text inside a sentence", async () => {
	await createIndex({});
	await addIndexDoc("2026-01-01", {
		title: "周末",
		text: "今天去了公园散步",
		dateUpdated: "2026-01-01",
		textFormat: "markdown",
	});
	expect(searchIndex("公园")).toEqual(["2026-01-01"]);
	expect(searchIndex(" 周末 ")).toEqual(["2026-01-01"]);
	expect(searchIndex("不存在")).toEqual([]);
});
