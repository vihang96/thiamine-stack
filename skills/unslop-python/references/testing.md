# Python testing patterns

pytest, with the criteria from the Tests section worked through. Read the entry for what
you are writing.

## Test the behavior, not the mock

```python
# rejected: asserts that the patch returned what the patch was told to return
def test_fetch(mocker):
    mocker.patch("app.client.get", return_value={"id": "1"})
    assert app.fetch("1") == {"id": "1"}
```

That test passes if `fetch` is `return client.get(...)` and it passes if `fetch` is
`return {"id": "1"}`. It cannot tell the two apart, which is the only thing worth knowing.

```python
# required: a real seam, asserting on behavior
def test_fetch_retries_once_on_timeout(httpx_mock):
    httpx_mock.add_exception(httpx.TimeoutException("slow"))
    httpx_mock.add_response(json={"id": "1"})

    assert app.fetch("1").id == "1"
    assert len(httpx_mock.get_requests()) == 2
```

## Mock at the boundary you do not own

Mock a paid API, a third-party network call, or a clock. Do not mock a database, a
filesystem, or your own modules, because all three can run locally and mocking them tests
your idea of how they behave rather than how they behave.

```python
# rejected: now the test passes even if the query is invalid SQL
mocker.patch("app.db.query", return_value=[User(id="1")])

# required: a real database, disposed after
@pytest.fixture
def db() -> Iterator[Database]:
    with Database.temporary() as database:
        database.migrate()
        yield database
```

## pytest.raises names the error

```python
# rejected: passes on a typo, an import error, or anything else
with pytest.raises(Exception):
    parse("")

# required
with pytest.raises(ParseError, match="unexpected end of input"):
    parse("")
```

Use `match` when the message is part of the contract. When it is not, matching on it makes
the test fail every time someone rewords an error, which trains people to stop reading
failures.

## Parametrize instead of copying

```python
# rejected: four tests, and a failure names none of the inputs
def test_parses_int(): assert parse("1") == 1
def test_parses_negative(): assert parse("-1") == -1
...

# required: one test, and the failure names the case
@pytest.mark.parametrize(
    ("text", "expected"),
    [("1", 1), ("-1", -1), ("0", 0), ("1_000", 1000)],
)
def test_parses_integers(text: str, expected: int) -> None:
    assert parse(text) == expected
```

## Fixtures do setup, not assertions

```python
# rejected: a failure here fails every test that uses the fixture, pointing at this line
@pytest.fixture
def user(db):
    created = db.create_user("a@b.c")
    assert created.id  # not the fixture's job
    return created
```

If the setup can fail in a way worth knowing about, that is its own test.

## Assert on values, not on text

```python
# rejected: restates the label, and breaks on any copy edit
assert page.title == "Your Account Settings"

# required: assert the behavior the label reflects
assert page.section_for(user).is_editable
```

Assert on text when the text is the behavior, such as an error message a caller matches on,
a rendered template under test, or a serialized format with a consumer.

## Coverage

Coverage tells you which lines ran, not which behaviors are checked. A file at full
coverage whose tests all assert on mocks is worse than an honest gap, because the number
says the opposite. Chase an uncovered branch when you cannot say what would break if it
were wrong, and leave it when you can.
