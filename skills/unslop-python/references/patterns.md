# Python patterns

One worked example per criterion, for the ones a single line does not carry. Read the entry
for the criterion you are applying rather than the whole file.

## No mutable defaults

The default is evaluated once, when the function is defined, and shared by every call that
omits it.

```python
# rejected: the list survives between calls
def append_to(item: Item, items: list[Item] = []) -> list[Item]:
    items.append(item)
    return items

# required
def append_to(item: Item, items: list[Item] | None = None) -> list[Item]:
    items = [] if items is None else items
    items.append(item)
    return items
```

The same applies to a class attribute, which `RUF012` catches: a `list` on the class is
shared by every instance.

## No Any

```python
# rejected: nothing downstream of this is checked
def handle(payload: Any) -> Any: ...

# required: name it, or take object and narrow
def handle(payload: WebhookPayload) -> Receipt: ...
```

Where the input genuinely is not known yet, `object` is the honest annotation. It accepts
anything and permits nothing until you narrow it, which is the opposite of `Any`.

## Catch the exception you can handle, and keep the cause

```python
# rejected: catches KeyboardInterrupt, hides the traceback, tells the caller nothing
try:
    return load(path)
except:
    raise Exception("failed")

# required
try:
    return load(path)
except OSError as err:
    msg = f"cannot read {path}"
    raise ConfigError(msg) from err
```

The message is bound to a name rather than inlined, which is what `EM102` asks for. Putting
it in the exception's `__init__` satisfies the same rule and is better when more than one
site raises it.

`from err` is what keeps the original traceback attached. Without it the support ticket
says `ConfigError` and stops there.

## Raise a defined type

```python
# rejected: the caller can print it and nothing else
raise Exception("user not found")

# required: the caller can branch
class UserNotFoundError(Exception):
    """Raised when a lookup finds no user for an id."""

raise UserNotFoundError(user_id)
```

The `Error` suffix is what `N818` asks for, and it is worth having because `except Timeout`
reads as a thing while `except TimeoutError` reads as a failure.

## The try body is the risky line only

```python
# rejected: a bug in transform() is reported as a parse failure
try:
    raw = path.read_text()
    parsed = json.loads(raw)
    return transform(parsed)
except json.JSONDecodeError as err:
    raise ConfigError(path) from err

# required
try:
    parsed = json.loads(path.read_text())
except json.JSONDecodeError as err:
    raise ConfigError(path) from err
return transform(parsed)
```

`TRY300` is the rule that pushes the trailing `return` out of the `try` and into `else` or
after the block.

## Ask forgiveness, not permission

```python
# rejected: two lookups, and the key can vanish between them
if key in cache:
    return cache[key]
return default

# required
try:
    return cache[key]
except KeyError:
    return default
```

For a plain dict, `cache.get(key, default)` is better than both. The pattern matters where
the check and the use can drift apart, which is any shared or remote resource.

## Log with fields, not f-strings

```python
# rejected: formats even when the level is off, and every message is unique
logger.info(f"user {uid} bought {n} items")

# required: deferred, and groupable by message
logger.info("purchase completed", extra={"user.id": uid, "item.count": n})
```

An f-string produces a distinct string per call, so a log aggregator sees a million
messages instead of one message with a million instances.

## No commented-out code

Deleted code is in git. Commented-out code is a claim that someone will come back to it,
and it is almost always false. It also survives search-and-replace, so it drifts out of
step with the code around it and then misleads the next reader.

## Paths are Path

```python
# rejected
with open(os.path.join(base, name, "config.json")) as f:
    data = json.load(f)

# required
data = json.loads((Path(base) / name / "config.json").read_text())
```

## Datetimes carry a timezone

```python
# rejected: naive, so it means something different depending on where it runs
created = datetime.now()

# required
created = datetime.now(tz=UTC)
```

A naive datetime compares fine against another naive datetime, which is how this survives
testing and fails in production.
