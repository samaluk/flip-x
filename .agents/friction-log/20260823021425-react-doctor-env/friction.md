---
title: 'react-doctor env rules invisible to rules list/explain'
severity: 'minor'
target: 'millionco/react-doctor'
---

Environment-level rules such as `react-doctor/require-pnpm-hardening` do not appear in `react-doctor rules list`, and `rules explain react-doctor/require-pnpm-hardening` returns \"Unknown rule\", so there is no supported way to learn what settings the rule wants or why it fired.

Workaround found: the rule ships in the installed bundle; grep the dist for its key to read the exact checks and help text, e.g. \`node -e \"const s=require('fs').readFileSync('node_modules/react-doctor/dist/index.js','utf8'); console.log(s.slice(s.indexOf('PNPM_HARDENING_RULE_KEY'), s.indexOf('PNPM_HARDENING_RULE_KEY')+6000))\"\`. That reveals it requires minimumReleaseAge present (recommends 10080), trustPolicy: no-downgrade, and no blockExoticSubdeps: false in pnpm-workspace.yaml.
