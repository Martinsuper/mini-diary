const app = {
	getPath: jest.fn().mockReturnValue("/path/to/mini-diary.txt"),
	getVersion: jest.fn().mockReturnValue("v0.0.0"),
	name: "Dayleaf",
};

module.exports = {
	app,
	remote: { app },
};
