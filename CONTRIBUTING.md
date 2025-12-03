# Contributing to @schie/fluent-zpl

Thanks for helping improve fluent-zpl! Please follow the guidelines below so changes stay consistent with the project’s standards and tooling.

## Ground rules

- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- Treat the TypeScript code and README/docs as the single source of truth for behavior and API shape.
- Keep the fluent API immutable—avoid introducing mutating helpers for `Label`, `ZPLProgram`, or related builders.
- Keep whitespace and significant bytes intact when parsing or serializing ZPL.
- Use the existing npm scripts; avoid custom commands in PR instructions.

## Getting started

- Requirements: Node.js >= 20 and npm (see `packageManager` in `package.json`).
- Install dependencies: `npm install`
- Recommended workflow:
  - Lint: `npm run lint`
  - Tests (coverage must remain 100%): `npm test -- --watchman=false` or `npm run test:coverage`
  - Build (before publishing or validating output types): `npm run build`
  - Docs (when documentation changes are needed): `npm run docs`

## Developing changes

- Add tests alongside code changes to preserve coverage. Prefer unit tests in `__tests__` that exercise immutable behavior and ZPL output.
- When adding printer configuration helpers, keep clamping invariants intact for `^MM`, `^MN`, `^PW`, `^PR`, `^MD`, `~TA`, `^LH`, and `^JU`.
- Avoid silent transforms—preserve whitespace and significant bytes when parsing/serializing ZPL.
- Update README or `docs/` when introducing new user-facing behavior or tooling steps.

## Pull requests

- Open an issue or reference an existing one; link it in your PR description.
- Keep PRs small and focused; mention affected modules in the title.
- Include tests and documentation updates with your change. PRs with failing lint/tests or reduced coverage will not be merged.
- Ensure `npm run lint` and `npm test -- --watchman=false` pass locally before requesting review.

## Commit style

- Use Conventional Commits (e.g., `feat: add rfid read helper`) to keep history consistent. `npx cz` can help format messages.
- Avoid force-pushing over others’ work; coordinate if you see unexpected changes or CI failures.

## Security

- Do not open public issues for security vulnerabilities. Follow the steps in [`SECURITY.md`](SECURITY.md) for responsible disclosure.
