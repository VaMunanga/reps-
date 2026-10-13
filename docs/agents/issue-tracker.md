# Issue tracker: GitHub

Issues and specifications for this repository live in GitHub Issues at `VaMunanga/reps-`. Use the `gh` CLI for issue operations from this clone.

## Conventions

- Create: `gh issue create --title "..." --body "..."`
- Read: `gh issue view <number> --json number,title,body,labels,comments`
- List: `gh issue list --state open`
- Comment: `gh issue comment <number> --body "..."`
- Label: `gh issue edit <number> --add-label "..."`
- Close: `gh issue close <number> --comment "..."`

Infer the repository from `git remote -v` when commands run inside this clone.

## Pull requests as a triage surface

**PRs as a request surface: no.**

When a skill says to publish to the issue tracker, create a GitHub issue. When it says to fetch a ticket, read the corresponding GitHub issue.

## Dependencies

Prefer GitHub sub-issues and native issue dependencies. If unavailable, record relationships in issue bodies with `Part of #<parent>` and `Blocked by: #<number>`.
