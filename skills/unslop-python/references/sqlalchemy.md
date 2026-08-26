# SQLAlchemy

Read this when the project uses SQLAlchemy 2.0 or later. These are conventions of the
library, not of Python, which is why they are here rather than in the criteria table.

## Columns are typed with Mapped

2.0 moved the type to the annotation, and the mapper reads it. An untyped column loses that.

```python
# rejected: the ORM knows the column, nothing else does
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String)

# required
class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(primary_key=True)
    email: Mapped[str]
    deleted_at: Mapped[datetime | None]
```

`Mapped[str]` and `Mapped[str | None]` are the difference between a nullable column and a
required one, so the annotation is carrying real information rather than decoration.

Do not annotate a column `Mapped[Any]`. The criteria table already rejects `Any`, and here
it also switches off the mapper's own inference.

## Sessions are explicit

```python
Session = async_sessionmaker(
    engine,
    autocommit=False,
    autoflush=False,
    autobegin=False,
    expire_on_commit=False,
)
```

Each flag turns off an implicit write or read.

`autoflush` is the one that surprises people. With it on, a read can emit pending writes
first, so a query in the middle of a function commits work the reader did not know about,
and a failure surfaces at the read rather than at the write that caused it.

`autobegin` off means a transaction starts where you say `begin()`, so the boundary is in
the code rather than inferred from the first statement.

`expire_on_commit` off keeps attributes readable after commit. With it on, touching a
loaded object after commit issues a fresh query, which is a surprising round trip inside
what looks like plain attribute access.

## Migrations

Two rules that cost a wasted afternoon each.

**Revision ids are at most 32 characters.** Alembic's own `alembic_version` table declares
`version_num` as `VARCHAR(32)`, so a longer id fails at apply time rather than at creation:

```
sqlalchemy.exc.DataError: value too long for type character varying(32)
```

Alembic's generated hash ids fit. A hand-written one such as
`revision: str = "add_workspace_retention_policy_table"` does not, and the failure names
the column rather than the revision, so it reads as a data problem in the migration
instead of a problem with its name. Keep a custom id short, or take the generated one.

**The migrations package depends on nothing from the application.** A migration runs
against a schema from a point in the past, but it imports code from the present. Import a
model into a migration and replaying history from zero breaks as soon as that model
changes, which is exactly when someone needs the replay to work. Spell the columns out in
the migration rather than deriving them from the model.

**Autogenerate drafts, it does not decide.** Alembic compares metadata to the database and
guesses. It does not see a rename, only a drop and an add, which discards the column's
data. Read every generated migration before committing it, and check the downgrade too.

## Load what you need, explicitly

A lazy relationship is a query that fires from attribute access, at a place in the code
that gives no sign of it. In a loop it is one query per row.

```python
# rejected: one query for orders, then one per order for its items
orders = (await session.scalars(select(Order))).all()
for order in orders:
    total = sum(item.price for item in order.items)

# required: state the load up front
orders = (
    await session.scalars(select(Order).options(selectinload(Order.items)))
).all()
```

`selectinload` issues a second query with an `IN` clause and is the right default for a
collection. `joinedload` widens the original query and suits a many-to-one, where it adds
columns rather than rows.

Prefer writing the query over reaching through a relationship. A `select` says what it
costs at the point you read it.
