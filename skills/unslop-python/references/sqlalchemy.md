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
