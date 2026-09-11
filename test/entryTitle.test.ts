import { titleDisplayValue } from "../src/renderer/utils/entryTitle";

test("keeps an empty diary title out of the editable document", () => {
	expect(titleDisplayValue("")).toBe("");
});

test("displays an existing diary title", () => {
	expect(titleDisplayValue("A real title")).toBe("A real title");
});
