# Security Policy

## Reporting a vulnerability

Please report security issues through [GitHub Security Advisories](https://github.com/samaluk/flip-x/security/advisories/new) for this repository. Do not open public issues for exploitable vulnerabilities.

## Authentication model

flip-x does not use accounts or passwords. Players are identified by a browser session ID stored client-side (`convex-helpers` sessions). Anyone who knows a session ID can act as that player in a match. Treat this as appropriate for casual private lobbies, not for high-stakes or authenticated play.

## Deployment safety

- Backend and E2E test wrappers **clear all app data** in the target Convex deployment before running. Never point them at a shared production deployment.
- `admin:clearAllAppDataViaCli` is an **internal** mutation and is only callable with Convex deploy credentials (for example via `convex run` in CI).

## Supported versions

Security fixes are applied on the `master` branch and deployed from there.
