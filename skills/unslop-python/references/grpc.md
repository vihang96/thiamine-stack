# gRPC

Read this when the project serves gRPC. These are service conventions rather than Python
ones.

## Servicers implement the generated base

A service class inherits the generated `*Servicer` and implements its methods. Inheriting
the generated base is what makes a signature change in the proto a failure at import
rather than a method the server silently never calls.

Keep generated code generated. Editing it by hand means the next `protoc` run reverts the
edit, usually in someone else's branch.

## Errors map to status codes

Returning a success with an empty body, or letting an exception escape as `UNKNOWN`, tells
the caller nothing it can act on.

```python
# rejected: the caller sees UNKNOWN and cannot tell a missing row from a bug
async def GetException(self, request, context):
    return await self._store.get(request.name)

# required
async def GetException(
    self,
    request: GetExceptionRequest,
    context: ServicerContext,
) -> Exception_:
    try:
        return await self._store.get(request.name)
    except NotFoundError:
        await context.abort(StatusCode.NOT_FOUND, f"no exception named {request.name}")
    except PermissionError:
        await context.abort(StatusCode.PERMISSION_DENIED, "caller may not read this")
```

Annotate the request and context types even though the generated base does not. The
annotation is what makes a proto change show up at the call site rather than at runtime.

The mapping worth holding to: `NOT_FOUND` for a missing resource, `INVALID_ARGUMENT` for a
request that could never succeed, `FAILED_PRECONDITION` for one that could succeed later,
`PERMISSION_DENIED` for authorization, and `UNAVAILABLE` for a dependency that is down.
`UNAVAILABLE` is the one clients retry, so returning it for a permanent failure produces a
retry storm.

## Servicer methods trip the naming rule

The generated base declares its methods in PascalCase, so an implementation has to match
and `N802` fires on every one. The method name is not yours to change.

Ignore it where the servicers live, in the project's own ruff config rather than in the
shared one, because the path is a project's layout:

```toml
[tool.ruff.lint.per-file-ignores]
"src/**/services/*.py" = ["N802"]
```

Ignore the rule for that directory, not for the repo. `N802` is worth keeping everywhere
a name is actually yours to pick.

## Resource names are parsed, not split

Resource names follow [AIP-122](https://google.aip.dev/122): a path of collection and id
pairs, such as `organizations/{org}/workspaces/{workspace}/exceptions/{exception}`.

Parse them with the project's parsing helper rather than `name.split("/")[-1]`. String
splitting works until the hierarchy gains a level, and then it fails by returning the wrong
id rather than by raising.

If the project has no parsing helper, write one before the third call site. The criteria
table already asks for that under strong types: a parsed name is a type, and a raw name is
a string that happens to have slashes in it.
