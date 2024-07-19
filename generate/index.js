
Error.captureStackTrace

import * as FS from "node:fs/promises";
import * as Path from "node:path";

await FS.mkdir(Path.resolve(import.meta.dirname, "../types/"), { recursive: true });
await Promise.all((await FS.readdir(Path.resolve(import.meta.dirname, "../types/"), { withFileTypes: true })).map(async entry => {
	await FS.rm(Path.resolve(import.meta.dirname, "../types/", entry.name), { force: true, recursive: true });
}));

const recursiveDirectoryIteration = async (/** @type {string} */ path) => {
	const folderContentURL = `https://api.github.com/repos/DefinitelyTyped/DefinitelyTyped/contents/types/node${path}?ref=master`;
	const /** @type {any} */ apiResponse = await (await global.fetch(folderContentURL)).json();
	for (const { name, type } of apiResponse) {
		const itemPath = `${path}/${name}`;
		if (type === "dir") {
			if (/^\/(?:scripts|test|v\d+)$/.test(itemPath)) continue;
			await FS.mkdir(Path.resolve(import.meta.dirname, "../types" + itemPath), { recursive: true });
			await recursiveDirectoryIteration(itemPath);
		} else if (type === "file") {
			if (!name.endsWith(".d.ts")) continue;
			const contentURL = `https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/node${itemPath}`;
			const content = await (await global.fetch(contentURL)).text();
			let lines = content.split("\n");
			if (!["/module.d.ts", "/process.d.ts"].includes(itemPath)) {
				let inDeclareGlobal = false;
				let declareGlobalIndentation = 0;
				let inNamespaceNodeJS = false;
				let namespaceNodeJSIndentation = 0;
				let inFetchAndFriendsRegion = false;
				let inBufferDTSBeforeAtob = false;
				let inGlobalsDTSBeforeGc = false;
				for (let i = 0; i < lines.length; ++i) {
					const indentation = lines[i].match(/^\s*/)[0].length;
					if (inDeclareGlobal) {
						if (indentation <= declareGlobalIndentation && lines[i].endsWith("}")) {
							inDeclareGlobal = false;
						} else if (lines[i].endsWith(" namespace NodeJS {")) {
							inNamespaceNodeJS = true;
							namespaceNodeJSIndentation = indentation;
						}
					}
					if (inFetchAndFriendsRegion) {
						if (lines[i].startsWith("// #endregion Fetch and friends")) {
							inFetchAndFriendsRegion = false;
						}
					}
					if ((inDeclareGlobal && !inNamespaceNodeJS && !inBufferDTSBeforeAtob && !inGlobalsDTSBeforeGc) || inFetchAndFriendsRegion) {
						lines[i] = "// " + lines[i];
					}
					if (inBufferDTSBeforeAtob && lines[i].trimStart().startsWith("var Buffer: ")) {
						inBufferDTSBeforeAtob = false;
					}
					if (inGlobalsDTSBeforeGc && lines[i].trimStart().startsWith("var exports: ")) {
						inGlobalsDTSBeforeGc = false;
					}
					if (inNamespaceNodeJS && indentation <= namespaceNodeJSIndentation && lines[i].endsWith("}")) {
						inNamespaceNodeJS = false;
					}
					if (lines[i].endsWith(" global {")) {
						inDeclareGlobal = true;
						declareGlobalIndentation = indentation;
						if (itemPath === "/buffer.d.ts") {
							inBufferDTSBeforeAtob = true;
						} else if (itemPath === "/globals.d.ts") {
							inGlobalsDTSBeforeGc = true;
						}
					}
					if (lines[i].startsWith("// #region Fetch and friends")) {
						inFetchAndFriendsRegion = true;
					}
				}
				if (itemPath === "/index.d.ts") {
					lines.unshift(
						``,
						`// #region Inserted by node-types-without-globals`,
						`/// <reference lib="ESNext" />`,
						`/// <reference lib="DOM" />`,
						`/// <reference lib="DOM.Iterable" />`,
						`// #endregion Inserted by node-types-without-globals`,
						``,
					);
				} else if (itemPath === "/timers.d.ts") {
					lines.push(
						`// #region Inserted by node-types-without-globals`,
						`declare module "timers" {`,
						`    global {`,
						`        function setImmediate<TArgs extends any[]>(`,
						`            callback: (...args: TArgs) => void,`,
						`            ...args: TArgs`,
						`        ): NodeJS.Immediate;`,
						`        // util.promisify no rest args compability`,
						`        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type`,
						`        function setImmediate(callback: (args: void) => void): NodeJS.Immediate;`,
						`        /**`,
						`         * Cancels an \`Immediate\` object created by \`setImmediate()\`.`,
						`         * @since v0.9.1`,
						`         * @param immediate An \`Immediate\` object as returned by {@link setImmediate}.`,
						`         */`,
						`        function clearImmediate(immediateId: NodeJS.Immediate | undefined): void;`,
						`    }`,
						`}`,
						`// #endregion Inserted by node-types-without-globals`,
						``,
					);
				}
			}
			await FS.writeFile(Path.resolve(import.meta.dirname, "../types" + itemPath), lines.join("\n"), { encoding: "utf-8" });
		} else {
			throw new Error(`Unexpected type: ${type}`);
		}
	};
};

recursiveDirectoryIteration("");
