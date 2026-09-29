### Apply Diátaxis to existing docs

**Improve a doc set one move at a time, with the compass deciding each move.** For a page
that explains and instructs at once, a docs folder nobody can navigate, a README that grew
into four documents, or a question of where a new piece of content goes.

The mode rules in `SKILL.md` say what each mode is. This playbook is the loop that gets
existing docs there. Diátaxis is a guide, not a plan: it tells you what to fix next, not what
the finished tree looks like.

1. Name the reader's question before you read the content. Each mode answers one question,
   and a page that answers two is two pages.

   | The reader asks | Mode | The page is |
   | --- | --- | --- |
   | "Can you teach me to...?" | tutorial | a lesson |
   | "How do I...?" | how-to | steps to a goal |
   | "What is...?" | reference | a dry description |
   | "Why...?" | explanation | a discussion |

   A reader who arrives from an error message asks "how do I". A new hire on day one asks
   "teach me". If you cannot say who arrives at the page and with what question, find out
   before you move anything.

2. Label every chunk with the compass, paragraph by paragraph. Ask the two questions of each
   chunk: does it inform action or understanding, and does it serve learning or work?
   Label down to the sentence where a paragraph mixes. Do not label by feel. The compass
   exists because gut feel files most content wrong, and it files it wrong in the direction
   of the page it already sits on.

3. Settle the boundaries that blur. Adjacent modes share a trait, so their content drifts
   across the line. Two pairs cause most mislabels.

   - **Tutorial or how-to.** Both are ordered steps. Difficulty does not decide it: a
     tutorial can teach something advanced, and a how-to can cover something basic. Ask
     whether the reader is at study or at work. A tutorial runs in a safe, contrived setup
     on one path with no choices, and the writer owns the reader's success. A how-to runs
     against the reader's real system, branches on "if you want x, do y", may get one
     chance, and the reader owns the outcome.
   - **Reference or explanation.** Both are knowledge rather than steps. Ask whether the
     reader consults it mid-task or reads it after stepping away. Tables, lists of options,
     flags, and error codes are reference. Content you would say to a colleague who asked
     "tell me about x" is explanation. The usual contamination is a reference example that
     grows a paragraph about why, which is explanation leaking in.

   The other two pairs drift less but still drift. How-to guides collect reference tables
   because both serve work, and tutorials collect background because both serve learning.
   In both cases the fix is the same: move the table or the background out and link to it.

4. Pick one move. Not a restructure, one move: split one mixed page, pull one table out of a
   tutorial, rename one how-to by its task, delete one digression. Prefer the move that fixes
   the page the most readers hit.

   Do not start by creating four empty sections named Tutorials, How-to guides, Reference,
   and Explanation. An empty quadrant is a promise the docs do not keep, and a structure
   imposed before the content exists forces content into the wrong box. The top-level
   structure appears once enough pages of each mode exist to need it.

5. Make the move so the docs are whole after it. Move the content to a page of its own mode,
   and leave one sentence and a link where it was. The page you took from must still read
   as complete, and the page you added must be useful on its own. Docs are never finished,
   but they are always in a usable state between moves.

   Then fix what the move exposed in each page, by mode:

   - A tutorial opens by naming what the reader will build and shows a result at every step.
   - A how-to is titled by the task ("How to rotate the signing key") and starts from a
     reader who already knows why.
   - A reference page mirrors the structure of the code it describes, so a reader can hold
     both side by side. Generate it from the code where you can.
   - An explanation title tolerates an implicit "About" in front and stays inside one topic.

6. Check functional quality before deep quality. Accuracy, completeness, consistency, and
   precision are testable: the command runs, the flag exists, the count is true at this
   commit. Diátaxis exposes gaps here, since a clean reference page makes a missing option
   obvious, but it does not fill them. Flow, fit to the reader, and anticipating the next
   question come after the facts are right, and they are judgment, not a checklist.

7. Repeat from step 2 on the next page, or stop. Stop when the next move fixes less than it
   costs, or when the remaining mix is one sentence that reads fine where it is. A single
   clause of why inside a how-to is a link waiting to happen, not a defect worth a page.

**Reply:** the reader and question for each page you touched, the labels that changed a
decision, the moves you made and where each piece of content went, and the next move you
would make with the reason it is next. When you stopped short of splitting a mixed page,
say why the mix is acceptable there.

Source: diataxis.fr (home, compass, the four mode pages, tutorials and how-to,
reference and explanation, map, quality, how to use Diátaxis), fetched 2026-09-28.
