# Trigger examples: <skill-name>

Prompts that must load this skill, and near-misses that must not. A manual rehearsal
today; these become `claude plugin eval` cases when that command leaves early access.

Write real prompts, in the words you would actually type. A near-miss is only useful if
it is genuinely close: something a reasonable agent might load this skill for, but
shouldn't.

## Should fire

- <a prompt in your own words>
- <a prompt that names the artifact type rather than the skill>
- <a prompt describing the symptom rather than the task>

## Should not fire

- <a near-miss> — <what should handle it instead>
- <a near-miss from an adjacent skill's territory> — <which skill owns it>
