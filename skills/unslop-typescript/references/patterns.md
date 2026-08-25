# TypeScript patterns

One worked example per criterion, for the criteria where a one-line rule does not carry
enough. Read the entry for the criterion you are applying. Do not read the file top to
bottom.

## Discriminated unions

A bag of optional fields lets the caller construct a state you never meant to allow.

```ts
// rejected: what is a result with both data and error set, or neither?
type Result = { data?: User; error?: string; loading?: boolean }

// required
type Result =
	| { kind: 'loading' }
	| { kind: 'ok'; user: User }
	| { kind: 'failed'; error: string }
```

The union has three inhabitants. The optional-field version has eight, five of which are
nonsense that every consumer has to defend against.

## Constructive modeling

Pick the shape that cannot hold the illegal value, rather than the shape plus a check.

```ts
// rejected: every read of items[0] needs a guard or a non-null assertion
type Page = { items: Item[]; first: Item }

// required
type Page = { items: [Item, ...Item[]] }
const first = page.items[0] // total, no guard
```

Ranges are the other common case. `{ start: Date; end: Date }` admits `end < start`.
`{ start: Date; duration: Duration }` does not.

## Simplest total type

Do not strengthen a type until the loose one forces a lie.

```ts
// fine: every operation here is total on an empty array
function count(items: Item[]): number {
	return items.length
}

// strengthen only here, where T[] would force items[0]!
function summarize(items: [Item, ...Item[]]): Summary {
	return { head: items[0], total: items.length }
}
```

A non-empty type on the first function buys nothing and costs every caller a construction
step.

## Branded types

Two `string` parameters in the same signature will be swapped eventually.

```ts
// rejected
function transfer(from: string, to: string, amount: number): void

// required
type AccountId = string & { readonly __brand: 'AccountId' }
function transfer(from: AccountId, to: AccountId, amount: Cents): void
```

Validate once, where the value enters, and the brand carries that proof everywhere after.

## No `as` casts, and never widen then assert

The widen-then-assert flow is the single most common shape of TypeScript slop. The value
was already known. It got widened to silence an error, then asserted back.

```ts
// rejected
const config: Record<string, unknown> = loadConfig()
const port = config.port as number

// required
const config = loadConfig() // returns a parsed Config
const port = config.port // already number
```

When an assertion genuinely has to stay, it documents the invariant that was checked:

```ts
// Safety: verified above that node.kind === 'call', which narrows args to Expression[].
const args = node.args as Expression[]
```

An assertion with no such comment is a claim with no evidence.

## No `unknown` in contracts

```ts
// rejected: every caller has to re-derive what this returns
async function fetchUser(id: string): Promise<unknown>

// required
async function fetchUser(id: UserId): Promise<User>
```

The one exception is the error `cause` convention, where `unknown` is honest because a
thrown value genuinely can be anything.

## Typed dictionaries

`Record<string, unknown>` is a parse input. It is never a stored shape.

```ts
// rejected: what is in here? every read is a cast
const settings: Record<string, unknown> = {}

// required
type Settings = { theme: Theme; fontSize: number }
const settings: Settings = parseSettings(raw)
```

## No conditional empty spread

```ts
// rejected: the type now depends on a runtime condition
const payload = { id, ...(includeName ? { name } : {}) }

// required
type Payload = { id: Id; name?: Name }
const payload: Payload = includeName ? { id, name } : { id }
```

## Boundary parsing over ad hoc checks

Scattered `typeof` checks are a parse, written badly and repeated.

```ts
// rejected
function handle(input: unknown) {
	if (typeof input === 'object' && input !== null && 'id' in input) {
		const id = typeof (input as { id: unknown }).id === 'string' ? (input as { id: string }).id : ''
	}
}

// required
function handle(input: unknown) {
	const event = parseEvent(input) // one parse, one error path, typed after
	use(event.id)
}
```

## Narrowing hierarchy

In order of preference: discriminant switch, `in`, `typeof` or `instanceof`, user-defined
guard. An assertion is not on the list, because it does not narrow anything. It silences
the checker.

## Honest type guards

```ts
// rejected: claims to check a User and checks nothing
function isUser(x: unknown): x is User {
	return typeof x === 'object' && x !== null
}
```

That guard is worse than an `as`, because the next reader sees a name that promises a
check. If the verification is more than a few lines, it is a parse, so write it as one and
return the parsed value instead of a boolean.

## Exhaustiveness

```ts
function userOf(result: Result): User | null {
	switch (result.kind) {
		case 'loading':
			return null
		case 'ok':
			return result.user
		case 'failed':
			return null
		default: {
			const _exhaustive: never = result
			throw new Error(`unhandled: ${JSON.stringify(_exhaustive)}`)
		}
	}
}
```

Adding a fourth variant to the union now fails the build at this line, which is the entire
point. Without it, the new variant falls silently into `default`.

## `satisfies` over `as`

```ts
// rejected: widens, so routes.home is string and typos survive
const routes = { home: '/', about: '/about' } as Record<string, string>

// required: checks the shape and keeps the literals
const routes = { home: '/', about: '/about' } satisfies Record<string, string>
```

## Real tests

```ts
// rejected: asserts that the mock returned what the mock was told to return
vi.mock('./db', () => ({ getUser: () => ({ id: '1' }) }))

// required: real seam, real assertion
const db = createTestDb() // in-memory, disposed after
const user = await getUser(db, id)
```

Mock only what cannot run locally, such as a paid third-party API. A database, a clock, and
a filesystem can all run locally.
