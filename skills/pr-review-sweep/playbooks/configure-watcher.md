# Configure and operate the daily PR watcher

Use this playbook to install the macOS watcher, inspect its queue, retry a failed
PR, or stop scheduled sweeps. Run commands from this skill's directory.

## Configure a new watcher

For an existing watcher, set `PR_SWEEP_CONFIG` to its configuration's absolute path
and skip the configuration steps. Keep the existing state directory to preserve
review history.

1. Choose an unused configuration path outside the stack. Copy the example there:

   ```sh
   PR_SWEEP_CONFIG="$HOME/.thiamine/pr-review-sweep/config.json"
   mkdir -p "$(dirname "$PR_SWEEP_CONFIG")"
   cp config.example.json "$PR_SWEEP_CONFIG"
   ```

2. Edit the configuration. Set `repo`, `actor`, `excludeAuthor`, `repositoryPath`,
   `stateDirectory`, `timezone`, and the binary paths for your machine. Set
   `blockingEvent` to the user's authorized publication preference. The default,
   `COMMENT`, reports blockers without submitting a formal changes request.
   If the checkout shares installed dependencies, set `dependenciesPath` to their
   absolute directory.
3. Authenticate `gh` and the Codex CLI. Confirm that the GitHub account matches
   `actor`. Confirm the user's authorization to publish in the configured scope,
   reusing permission already given for recurring sweeps.
4. Inspect which PRs qualify:

   ```sh
   node scripts/watcher.mjs scan --config "$PR_SWEEP_CONFIG"
   ```

   Expect `status: scan` and a list of PRs marked `would_review`. This command
   neither invokes Codex nor publishes reviews.
5. To inspect draft reviews before enabling publication, run:

   ```sh
   node scripts/watcher.mjs once --config "$PR_SWEEP_CONFIG" --dry-run
   ```

   Inspect the returned `runDir` paths. Draft mode invokes Codex but does not post
   or mark a commit reviewed.
6. Enable the daily watcher:

   ```sh
   node scripts/service.mjs install --config "$PR_SWEEP_CONFIG"
   ```

   Installation links the skill into Codex and registers a user LaunchAgent.
   The service checks every 15 minutes and catches up after sleep. It completes
   one daily sweep while the laptop lid is open, using the configured time zone.
   If the lid closes during a review, that review can finish. Publication and
   remaining PRs wait for an open lid. The daily rule applies to scheduled runs.

## Inspect the watcher

Inspect the LaunchAgent and review queue:

```sh
node scripts/service.mjs status --config "$PR_SWEEP_CONFIG"
node scripts/watcher.mjs status --config "$PR_SWEEP_CONFIG"
```

Confirm that the agent uses the expected script and configuration paths. An idle
agent can be waiting for its next check. Inspect `lastRun`, `lastScheduledDate`,
`tracked`, `pending`, and `failures` in the queue output. Evidence and logs remain
under `stateDirectory`.

## Retry a failed PR

Check the recorded error before retrying. Failed reviews retry with increasing
waits up to `maxAttempts`. After that, the PR appears as `needs_attention` in the
sweep's skipped list.

To queue PR 123 for another attempt, run:

```sh
node scripts/watcher.mjs retry --pr 123 --config "$PR_SWEEP_CONFIG"
```

Expect `retryQueued: 123`. The next scheduled check can attempt that PR again.

To run an extra sweep immediately, use:

```sh
node scripts/watcher.mjs once --config "$PR_SWEEP_CONFIG"
```

An immediate manual sweep can publish. It bypasses the daily limit and lid check.

## Stop scheduled sweeps

```sh
node scripts/service.mjs uninstall --config "$PR_SWEEP_CONFIG"
```

Confirm that service status no longer finds the agent. Uninstalling retains the
skill, configuration, queue, and review evidence.

## Report the result

Report the configuration path, service status, tracked PR count, and any failed or
incomplete work. For published reviews, confirm their URLs and reviewed SHAs.

The watcher uses the installed Codex CLI and structured output described in
[OpenAI's non-interactive mode documentation](https://developers.openai.com/codex/noninteractive/),
fetched 2026-10-14.
