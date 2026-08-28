### Prune the record

**Cut the entries whose change has landed, and promote the few that outlive it.** For a
record that outlived several changes, for the long-lived one on a default branch, and for a
workspace holding records nobody deleted.

The log is append-only while the work is in flight. This is the one moment it is edited.

1. Sweep first. `sh scripts/records.sh <workspace-root>` reports every record with the state
   of its branch. Decide from the table, not by reading each file.

   | State | Do |
   | --- | --- |
   | `live` | leave it, the change is in flight |
   | `merged` | step 2, then delete the file |
   | `no-branch` | step 2, then delete the file |
   | `default` | prune in place, steps 2 and 3 |

   Check that `merged` really merged before taking a file apart on the strength of it.

2. Give every landed entry one of three dispositions:

   - **It generalizes past this change.** It is a standard, worth more where the next
     session will hit it. `reflect` decides skill or rule, `continual-learning` takes the
     durable facts. Move it, then cut it.
   - **It still constrains the code.** It belongs beside the code: an ADR, a test that fails
     when the constraint breaks, or a comment. A constraint in a gitignored file is not
     documented.
   - **Neither.** Delete it. Most entries are this.

3. Keep the ones that stop a repeat. A deviation and a failed attempt outlive their change,
   because the next session is about to try it again. Cut them once the code they warn about
   is gone.

4. Rewrite the header. If `Status` and `Next` describe work that landed, pruning the log
   will not fix it.

5. Delete the file when the change landed and nothing survived step 2. That is the normal
   end of a record.

**Reply:** one line per promoted entry naming where it went, the entry count before and
after for anything pruned in place, and the records you deleted. Name the ones you left.
