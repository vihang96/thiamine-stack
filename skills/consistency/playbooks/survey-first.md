### Survey first

**Find out how this concern is already answered before choosing an answer.** For introducing
a pattern, picking a library, adding a store, styling a new surface, or starting a service.

Ten minutes here saves a migration. The search is cheap and the fork is not.

1. Name the concern in a way the codebase would recognise. Not "how should I handle this",
   but "how does a request get authorised here" or "where do spacing values come from". A
   concern you cannot name is one you cannot search for.

2. Search widely, not in this repo alone. In a workspace the precedent usually lives in a
   sibling service, and the one you are working in is the newest and least representative.
   Look at the manifests as well as the code, since a dependency list answers "which library"
   faster than reading call sites.

3. Count the answers you find, and which is most recent and most used. Three call sites in
   the newest service beats forty in the oldest if the direction of travel is clear, so read
   the dates. Where the answers disagree, note it and go to `playbooks/converge.md` rather
   than picking silently.

4. Take the existing answer by default, and say that you did. Using what is there is the
   outcome, not a compromise. The bar for departing is that the existing answer fails at
   something this change actually needs, named specifically.

5. Where there genuinely is no answer, you are setting the precedent. Say so explicitly, and
   treat the choice with the weight that implies. Exhaust the options first with the
   prototype playbook in `pre-implementation` rather than taking the first thing that works,
   then record it with `playbooks/record-the-decision.md`.

**Reply:** the concern as you named it, what you found and where by repo and path, how many
distinct answers exist, which one you are using, and whether that is following precedent,
departing from it, or setting it. When departing, name the specific thing the existing answer
could not do.
