# Test Suite Refactor Recommendations

## Summary

✅ **All 15 test files are properly aligned with the post-refactor architecture.**

- No broken imports
- No deprecated file references  
- All 9 core game modules are properly tested
- All 62 tests passing

## Issues Found

### 🔴 High Priority: Split Oversized Test Files

#### 1. `turn-resolution.test.ts` (418 lines, 19 tests)
**Current**: Mixes opening deal, turn mechanics, Flip Three, actions, duplicates, Second Chance

**Recommendation**: Split into 4 files
```
turn-resolution-opening.test.ts      → Initial deal logic
turn-resolution-mechanics.test.ts    → Hit/stay, active play, busting
turn-resolution-flip-three.test.ts   → Flip Three sequences, deferred actions
turn-resolution-actions.test.ts      → Freeze, Second Chance resolution
```

#### 2. `game-command-runner.test.ts` (394 lines, 6 tests)
**Current**: Tests START_MATCH, TAKE_TURN, RESOLVE_ACTION, idempotency, finalization together

**Recommendation**: Split into 3 files
```
game-command-start.test.ts        → START_MATCH, idempotency setup
game-command-turns.test.ts        → TAKE_TURN, RESOLVE_ACTION
game-command-finalization.test.ts → Round completion, scoring, persistence
```

## Tests to Keep As-Is

✅ **7 focused unit tests** (144–209 lines each)
- events.test.ts
- flip-three-dealt-first.test.ts
- rng.test.ts
- round-history-builder.test.ts
- scoring.test.ts
- serializers.test.ts
- deterministic-replay.test.ts (unit)

✅ **7 integration tests** (34–287 lines each)
- deterministic-scenarios.test.ts
- deterministic-replay.test.ts (confect)
- deterministic-divergence.test.ts
- matches.test.ts
- rounds.test.ts
- turns.test.ts

## Next Steps

1. **Immediate**: No action required—all tests are currently aligned and passing
2. **Soon**: Consider splitting the 2 oversized test files for maintainability
3. **Ongoing**: Keep fixture maintenance in sync with type changes

## Test Coverage Summary

| Layer | Files | Tests | Status |
|-------|-------|-------|--------|
| Unit Logic | 8 | 41 | ✅ All aligned |
| Integration (Confect) | 7 | 21 | ✅ All aligned |
| **Total** | **15** | **62** | **✅ Passing** |

---

**Generated**: 2026-04-24  
**Analysis**: All modules exist post-refactor. No deprecated references found.
