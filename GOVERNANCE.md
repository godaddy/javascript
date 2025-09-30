# Governance

## Levels of Involvement

### Contributor

Anyone who contributes through pull requests, responses to issues,
documentation or otherwise, is a contributor.

### Maintainer

Maintainers have commit permissions. They are responsible for creating release
commits. Finally, they are responsible for closing out issues
that are duplicates, not reproducible or otherwise should not be addressed. New
maintainers are added by existing maintainers at their discretion. If you want
to become a maintainer, start by looking at the issues and current open pull requests. You can
triage existing issues, provide fixes, and/or create issues that will improve
the packages for the community at large. You can view the current list of maintainers
in the [Javascript Github group].

### Code Owner

A code owner is a maintainer with an extra level of commitment. Code owners are
expected to make themselves available to review pull requests and discuss
architectural or core code changes. Code owners also have veto power
over "core" package changes, which we define here as breaking change or major
refactors to the plugin engine or the cli. Code owners are a small group by
design, and new code owners will be added only rarely. Code owners are listed
[here][code owners].

## Consensus-seeking

Different levels of consensus are needed for different kinds of changes. For
small PRs, it is sufficient to get the two approvals you need to merge the PR.

For major design additions or refactors, it is more important to get buy-in from
other contributors before starting. Post in the [Discussions], and allow a few
days for other contributors to weigh in. Your goal here is to 1) get feedback on
your plan before investing the time in a PR and 2) to get buy-in from other
contributors. Once you have addressed blocking feedback and received some
buy-in, you are ready to proceed with code changes.

Roadmap changes require a lengthier discussion: when you propose a roadmap
change, allow at least a week for as many maintainers as possible to respond.
Your goal here should be to get buy-in from all maintainers (with silence
interpreted as approval). In rare cases, there may prove to be irresolvable
disagreement between maintainers, in which case it is acceptable to conduct a
majority vote.

[Discussions]: https://github.com/godaddy/javascript/discussions
[Javascript Github group]: https://github.com/orgs/godaddy/teams/javascript
[code owners]: ./CODEOWNERS
