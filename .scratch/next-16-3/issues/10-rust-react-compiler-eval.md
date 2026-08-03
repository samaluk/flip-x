# 10 — Evaluate Rust React Compiler (experimental)

**What to build:** The Turbopack-native React Compiler is tried behind `reactCompiler` + `experimental.turbopackRustReactCompiler`, measured on cold/warm dev startup and production build, with a clear keep-or-revert decision.

**Blocked by:** 01 — Move from 16.3 preview to 16.3 stable

**Status:** ready-for-agent

- [ ] Flags enabled per bundled docs
- [ ] `pnpm dev` and `pnpm build` complete without compiler errors on game UI
- [ ] Cold vs warm dev-to-ready timing noted (informal benchmark)
- [ ] Decision recorded in AGENTS.md: enabled permanently, behind flag, or reverted with reason
- [ ] No Babel dependency reintroduced for other transforms
