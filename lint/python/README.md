# Python lint layer

ruff carries both the linting and the formatting, and it has no plugin API. Authoring a
Python rule set therefore means selecting from its rules and writing prohibitions, rather
than writing rule code.

```
ruff.toml                 the selection and the prohibitions
lints-available.txt       every ruff rule, generated, for validating citations
fixture/                  a project that must fail, for verifying the wiring
```

## Wire it into a project

Merge `ruff.toml` into the project's `pyproject.toml` under `[tool.ruff]`, or copy it to
the project root as a standalone `ruff.toml`. ruff reads either, and prefers
`pyproject.toml` when both exist.

```sh
uv add --dev ruff
uv run ruff check --fix
uv run ruff format
```

Preserve whatever the project already selected. If it already ignores a rule this config
selects, keep the ignore and say which one you kept, since it usually encodes something
about that codebase.

## What banned-api buys

`[lint.flake8-tidy-imports.banned-api]` takes an import path and a message, and ruff prints
the message where the code fails:

```
src/bad.py:4:8: TID251 `pickle` is banned: pickle executes arbitrary code on load.
src/bad.py:8:5: TID251 `os.system` is banned: os.system hands a string to a shell.
```

It matches attribute access as well as imports, so banning `os.system` catches a call
through an allowed `import os`. This is the one place a project-specific rule can be
written, so it carries the prohibitions ruff has no rule for.

Selecting `TID` is what turns the table on. Without it the entries are silently inert.

## Verify after wiring

```sh
cd lint/python/fixture && ruff check --no-cache src/bad.py
```

The fixture must report 16 findings. Every line in `src/bad.py` is annotated with the rules
it trips. A quiet run means the config is not loaded, which reads exactly like clean code.

## Formatting

`ruff format` replaces black, and `ruff check --fix` with the `I` rules replaces isort.
Neither needs configuration here. Line length is set once in `ruff.toml` and `E501` is
ignored, because the formatter owns line breaks and warning about them twice is noise.

## Source

The rule selection is ours. The criteria these rules enforce live in
`skills/unslop-python/`, which names each rule in its Enforceable-by column.
`scripts/validate.mjs` fails if that skill cites a rule ruff does not have, checked against
`lints-available.txt`. Regenerate that snapshot with `scripts/regen-lints.sh`.
