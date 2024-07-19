
# Node.js types without globals

Unofficial TypeScript definitions for node without the globals already in lib.dom.d.ts

Node's [`@types/node`](https://www.npmjs.com/package/@types/node) package contains all type definitions for Node.js, but it also includes various globals like `fetch()` or `setTimeout()` that are already in `lib.dom.d.ts`. This is fine if 100% of your project's code runs in a standalone runtime like Node.js, but if *some* parts of your code run in node while others run in the browser, or if you have files that are meant to be run both in the browser and in Node, these global functions and objects are then defined twice (once in `@types/node` and once in `lib.dom.d.ts`), which can be annoying and lead to unexpected things.

This package is an automatically-scraped copy of `@types/node`, but with all globals that are already in `lib.dom.d.ts` removed. Therefore, you can now simply include both the `DOM` lib and the node types without them interfering with each other.

---

Install the npm package:
```sh
npm i --save-dev node-types-without-globals@latest
```
And then include it in your tsconfig.json:
```jsonc
{
	"compilerOptions": {
		"module": "ESNext",
		"target": "ESNext",
		"moduleResolution": "Bundler",
		"lib": ["ESNext", "DOM", "DOM.Iterable"],
		"types": ["node-types-without-globals"],
	},
}
```

---

npm: [`node-types-without-globals`](https://www.npmjs.com/package/node-types-without-globals) <br>
GitHub: [BenjaminAster/node-types-without-globals](https://github.com/BenjaminAster/node-types-without-globals)
