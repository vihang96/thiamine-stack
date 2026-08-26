---
name: unslop-python
description: "Rejects low-evidence Python: Any in signatures, bare except, mutable default arguments, commented-out code, print in shipped code, and tests that assert on mocks. Assumes uv and ruff. Use when reading or editing any .py file, when reviewing a Python diff, or when setting up a Python project."
owns: "Python correctness and API discipline, and the uv and ruff toolchain this stack assumes"
see_also: [unslop-prose]
---

# Unslop Python

Make the signature carry the contract. Python will run almost anything, so the type
annotation, the exception type, and the test are the only places a claim gets checked. Most
Python slop is one of those three quietly widened until nothing is asserted at all.

Two rules outrank everything below. Prefer the change that makes the bad state impossible
over the change that catches it. When a criterion here would make the code worse, add a
`# noqa: RULE` with the reason on the same line, so the exception is visible where it
applies.

## Stack

This skill assumes **uv** for packages and environments, and **ruff** for linting and
formatting. It is not tool-agnostic, and the criteria below name ruff rules directly.

```sh
uv sync                    # install from the lockfile
uv add httpx               # add a dependency and update the lockfile
uv run pytest              # run inside the project environment
uv run ruff check --fix    # lint
uv run ruff format         # format
```

Never `pip install` into a uv project, and never edit `uv.lock` by hand. Both put the
environment out of step with the lockfile, and the next `uv sync` silently undoes the work.

`ruff format` owns line breaks, so line length is not an authoring concern. There is no
type checker in this stack, which is why several rows below are `review` rather than a
rule: ruff checks that an annotation is present, not that it is true.

## Scope

This skill owns Python correctness, API discipline, and the toolchain. General engineering
rules stay in `rules/RULES.md`, and prose belongs to `unslop-prose`, including docstrings
and the reason on a `# noqa`.

## Types and signatures

| Criterion | What it requires | Enforceable by |
| --- | --- | --- |
| Signatures are annotated | Every public function annotates its arguments and its return. An unannotated signature documents nothing and checks nothing. | `ruff::ANN001`, `ruff::ANN201` |
| No `Any` | `Any` switches off checking wherever it lands. Name the type, or take `object` and narrow it. | `ruff::ANN401`, `ruff::TID251` |
| Containers state their contents | `list` and `dict` alone say only that indexing will not crash. Write `list[User]`, `dict[str, Cents]`. | review |
| Modern syntax for types | `list[str]` and `X \| None`, not `List[str]` and `Optional[X]`. | `ruff::UP006`, `ruff::UP007` |
| No mutable defaults | A default list or dict is created once and shared by every call that omits it. | `ruff::B006`, `ruff::RUF012` |
| No boolean positional arguments | `render(doc, True)` tells the reader nothing. Make it keyword-only. | `ruff::FBT001`, `ruff::FBT002` |
| Few arguments | A function taking many arguments is usually two functions, or one that wants a dataclass. | `ruff::PLR0913` |

## Errors

| Criterion | What it requires | Enforceable by |
| --- | --- | --- |
| Catch the exception you can handle | A bare `except` swallows `KeyboardInterrupt` and every bug alike. Name the type. | `ruff::E722` |
| Keep the cause | Re-raising inside an `except` without `from` hides the original traceback. | `ruff::B904` |
| Raise a defined type | `raise Exception("failed")` gives the caller nothing to match on. Define the exception. | `ruff::TRY002`, `ruff::N818` |
| Messages live on the exception | Assign the message or put it in the exception class, rather than inlining a literal at every raise site. | `ruff::EM101`, `ruff::TRY003` |
| The `try` body is the risky line only | A long `try` catches failures from code that was never in question. | `ruff::TRY301`, `ruff::TRY300` |
| Ask forgiveness, not permission | `try: d[k] except KeyError:` beats `if k in d:`, which checks the key twice and races. | review |
| Compare identity with `is` | `value == None` calls `__eq__`. `type(x) == list` ignores subclasses. | `ruff::E711`, `ruff::E721` |

## Surface and dead weight

| Criterion | What it requires | Enforceable by |
| --- | --- | --- |
| No commented-out code | Deleted code lives in git. Commented-out code is a claim that someone will come back. | `ruff::ERA001` |
| No `print` in shipped code | Emit a log record with fields, not a line of text nobody can filter. | `ruff::T201` |
| Log with fields, not f-strings | `logger.info("user %s", uid)` defers formatting and keeps the message groupable. | `ruff::G004`, `ruff::LOG015` |
| No unused arguments | An argument nobody reads is a signature nobody updated. | `ruff::ARG001`, `ruff::ARG002` |
| Explicit imports | `from x import *` makes every name's origin a guess and every rename silent. | `ruff::F403`, `ruff::F401` |
| No reaching into other objects | Touching `other._thing` couples you to a promise that was never made. | `ruff::SLF001` |
| No placeholder bodies | A `pass` or `...` left where code was meant to go. | `ruff::PIE790` |

## Security and the standard library

| Criterion | What it requires | Enforceable by |
| --- | --- | --- |
| No `pickle` on untrusted input | Loading a pickle executes whatever it contains. | `ruff::S301`, `ruff::TID251` |
| No shell strings | `os.system` and `subprocess(shell=True)` concatenate their way into injection. Pass an argument list. | `ruff::S605`, `ruff::TID251` |
| Paths are `Path` | `pathlib` handles separators, encodings, and existence checks that `os.path` string juggling does not. | `ruff::PTH123` |
| Datetimes carry a timezone | `datetime.now()` is naive, and a naive datetime is wrong somewhere. | `ruff::DTZ005` |
| No magic values in comparisons | A bare number in a condition names nothing. Bind it. | `ruff::PLR2004` |

## Tests

| Criterion | What it requires | Enforceable by |
| --- | --- | --- |
| Test the behavior, not the mock | Patching a function and asserting it returned what you set tests the patch. | review |
| Mock at the boundary you do not own | A network call, a paid API, a clock. A database, a filesystem, and your own modules can run. | review |
| `pytest.raises` names the error | `pytest.raises(Exception)` passes on a typo. Match the type, and the message when it is the behavior. | `ruff::PT011` |
| Parametrize instead of copying | Four near-identical tests are one test with four cases, and the diff shows which case broke. | review |
| Fixtures do setup, not assertions | A fixture that asserts fails every test that uses it, pointing at the wrong line. | `ruff::PT019` |
| Assert on values, not on text | A snapshot of a label restates the label. Assert text only when the text is the behavior. | review |
| Tests may assert | `assert` in shipped code is stripped under `-O`, but in tests it is the point. The ruff config allows it under `tests/`. | `ruff::S101` |

## Enforcement status

The rules named above are configured in `lint/python/`, and `scripts/validate.mjs` fails if
this skill names a rule that is not in ruff. Wiring the config into a project is
`lint/python/README.md`.

ruff has no plugin API, so a project-specific prohibition is written as a `banned-api`
entry, which is the `TID251` rows above. ruff prints the message inline where the code
fails.

Rows marked `review` need judgment. Most of them are the test criteria, because whether a
test asserts something meaningful is not decidable from syntax.

Sources: the `python-patterns` and `python-testing` skills from `github.com/affaan-m/ECC`,
fetched 2026-08-25, reduced to the anti-slop subset and repointed at uv and ruff. Their
tooling section assumed black, isort, pylint, and bandit, none of which this stack uses.

## Worked example

Before:

```python
import pickle


def load(path, items=[]):
    print("loading " + path)
    try:
        return pickle.loads(open(path, "rb").read())
    except:
        raise Exception("failed")
```

After:

```python
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class ConfigError(Exception):
    """Raised when a config file cannot be read or parsed."""

    def __init__(self, path: Path) -> None:
        super().__init__(f"cannot read config at {path}")


def load(path: Path, items: list[Item] | None = None) -> Config:
    items = items if items is not None else []
    logger.info("loading config", extra={"config.path": str(path)})
    try:
        return Config(**json.loads(path.read_text()))
    except OSError as err:
        raise ConfigError(path) from err
```

What each criterion fixed. The unannotated signature gained types, and `items=[]` became
`None` so the default is not shared across calls (signatures are annotated, no mutable
defaults). `pickle` became `json`, since the input is untrusted (no `pickle`). `print`
became a log record with a field (no `print`, log with fields). The bare `except` named
`OSError` and kept the cause with `from err` (catch what you can handle, keep the cause).
`Exception` became a defined type the caller can match, carrying its own message rather
than an f-string at the raise site (raise a defined type, messages live on the exception).
`open()` became `Path.read_text()` (paths are `Path`).

More examples live in `references/patterns.md`, and the test criteria are worked through in
`references/testing.md`.

## Review checklist

Run this against a finished Python diff.

1. Does every public signature annotate its arguments and its return?
2. Does `Any` appear anywhere it could be a real type?
3. Does any `except` catch more than it can handle, or drop the cause?
4. Can a caller match on the exceptions this code raises, or only read them?
5. Is there a mutable default, a boolean positional, or a bare number in a condition?
6. Is there commented-out code, a `print`, or an argument nobody reads?
7. Does any test assert on a mock rather than on behavior?
8. Does `pytest.raises` name a specific exception?
9. Was the dependency added with `uv add`, so the lockfile moved with it?
