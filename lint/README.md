# Lint layer

One directory per language. Each holds a plugin that works in more than one linter, so a
target repo can adopt the rules without switching tools.

```
lint/typescript/    Oxlint and ESLint, from one plugin
```

The criteria these rules enforce live in the matching skill, such as
`skills/unslop-typescript/`. The skill names each rule in its Enforceable-by column, and
`scripts/validate.mjs` fails if a skill claims a rule that is not here. An enforcement
claim cannot go stale without the validator noticing.

## Wire it into a repo

Detect which linter the target repo already uses. Do not introduce a second one.

| Found                                 | Wire it there                                 |
| ------------------------------------- | --------------------------------------------- |
| `.oxlintrc.json` or `oxlint.config.*` | Oxlint                                        |
| `eslint.config.*`                     | ESLint                                        |
| both                                  | Oxlint, and say that ESLint was left alone    |
| neither                               | ask which the user wants before adding either |

Copy `lint/<language>/` into the target repo, for example to
`tools/lint/<language>/`. These rules are meant to be read and edited in the repo that
uses them, so a copy is correct here and a symlink is not.

### Oxlint

```jsonc
{
	"jsPlugins": [{ "name": "anti-slop", "specifier": "./tools/lint/typescript/index.ts" }],
	"rules": { "anti-slop/no-unknown-returns": "error" },
}
```

Install `oxlint` and `@oxlint/plugins` at matching versions. Add the vendored directory to
`ignorePatterns` so the linter does not lint its own rules.

### ESLint

ESLint needs three things that Oxlint does not: `typescript-eslint` as the parser, flat
config on ESLint 9 or later, and `jiti` if the config file is TypeScript.

```ts
import tseslint from 'typescript-eslint'
import antiSlop from './tools/lint/typescript/index.ts'

export default [
	{
		files: ['**/*.ts'],
		languageOptions: { parser: tseslint.parser },
		plugins: { 'anti-slop': antiSlop },
		rules: { 'anti-slop/no-unknown-returns': 'error' },
	},
]
```

Without the parser, the TypeScript nodes these rules visit never appear and every rule
silently passes. That failure looks exactly like a clean codebase.

## Verify after wiring

Write a file that should fail, run the linter, and confirm the rule fires. A lint layer
that reports nothing is indistinguishable from a lint layer that is not loaded.

```sh
cd lint/typescript && npm install && npm test
```

That runs the rule set's own tests, which is the other half of the check.

Each language directory owns its `package.json`, so the dependencies travel with the
directory when you copy it into a target repo. Nothing else in this repo needs npm.

## Adding a language

Create `lint/<language>/`, and name rules so the matching skill can claim them. The
validator holds a skill named for a language to that language's rules, so
`unslop-typescript` cannot satisfy a claim with a rule under `lint/python/`.

Keep rules syntactic where the linter has no type information. Oxlint has none, so a rule
needing the TypeScript checker would work under ESLint alone and break the promise that
one plugin serves both.
