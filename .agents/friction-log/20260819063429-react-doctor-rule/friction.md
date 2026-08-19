---
title: 'React Doctor rule lookup requires plugin prefix'
severity: 'minor'
target: 'react-doctor'
---

## What happened
The CI diagnostic reported the rule as `react-hooks-js/preserve-manual-memoization`, but `react-doctor rules explain preserve-manual-memoization` returned `Unknown rule`. The local scan and `why` output were needed to identify the plugin-qualified rule and the inferred-vs-source dependency mismatch.

## Expected
`rules explain` should accept the rule key shown in diagnostics, or the CLI help should document that the plugin prefix is required.

## Impact
Rule-specific triage is slower because the first documented command does not accept the displayed rule name.
