# Next.js 16.3 adoption tracker

- **Spec:** [spec.md](./spec.md)
- **Epic:** https://github.com/samaluk/flip-x/issues/478

## Already on master

- `typescript@7.0.2`, `experimental.useTypeScriptCli: true` — see #480 (closed)
- `next@16.3.0` stable — see #479 (closed)

## Local tickets → GitHub

| Local | GitHub | Blocked by |
|-------|--------|------------|
| [01](./issues/01-preview-to-stable.md) | [#479](https://github.com/samaluk/flip-x/issues/479) | — |
| [02](./issues/02-turbopack-build-cache-ci.md) | [#481](https://github.com/samaluk/flip-x/issues/481) | #479 |
| [03](./issues/03-zero-config-wins-and-immutable-assets.md) | [#482](https://github.com/samaluk/flip-x/issues/482) | #479 |
| [04](./issues/04-catcherror-game-error-boundary.md) | [#484](https://github.com/samaluk/flip-x/issues/484) | #479 |
| [05](./issues/05-enable-instant-navigation-flags.md) | [#483](https://github.com/samaluk/flip-x/issues/483) | #479 |
| [06](./issues/06-migrate-cache-components.md) | [#485](https://github.com/samaluk/flip-x/issues/485) | #483 |
| [07](./issues/07-partial-prefetch-navigation.md) | [#486](https://github.com/samaluk/flip-x/issues/486) | #485 |
| [08](./issues/08-instant-playwright-tests.md) | [#487](https://github.com/samaluk/flip-x/issues/487) | #485 |
| [09](./issues/09-offline-resilience.md) | [#488](https://github.com/samaluk/flip-x/issues/488) | #483, #485 |
| [10](./issues/10-rust-react-compiler-eval.md) | [#489](https://github.com/samaluk/flip-x/issues/489) | #479 |

Work the **frontier**: any ticket whose blockers are closed. Kick off `/implement` per ticket in a fresh context window.
