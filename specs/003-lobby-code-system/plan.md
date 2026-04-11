# Implementation Plan: [FEATURE]

**Branch**: `003-lobby-code-system` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Refactor the lobby creation flow to use a lobby code system with two homepage options (Create Game / Join Lobby). Hosts explicitly start the game from the lobby after players join.

## Technical Context

**Language/Version**: TypeScript (Next.js 16.2.3, React 19.2.4)  
**Primary Dependencies**: Convex (backend), Next.js, shadcn/ui, Lucide icons  
**Storage**: Convex serverless database  
**Testing**: Vitest  
**Target Platform**: Web (desktop + mobile responsive)  
**Performance Goals**: Lobby creation and code validation <1 second  
**Constraints**: Must preserve anonymous session system (localStorage-based)  
**Scale/Scope**: Single-page web app, 3-8 players per match

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Code Quality**: Use minimal new modules. Add lobby code to existing matches table. Create two UI components: HomePage (with Create/Join options) and LobbyCodeDisplay (in existing game page). No speculative abstractions.
- **Testing**: Add unit tests for lobby code generation and validation in Convex. Add integration test for homepage flow (create → lobby → start). Test error states for invalid codes.
- **User Experience Consistency**: Follow existing MatchSetup patterns for Create Game flow. Reuse existing game page layout for lobby. Maintain consistent loading/success/error states across all user flows.
- **Performance**: Target <1s for lobby creation and code validation. No additional database queries on homepage load.
- **Exceptions**: None. Simpler design is achievable.

## Project Structure

### Documentation (this feature)

```
specs/003-lobby-code-system/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── checklists/          # Validation checklists
```

### Source Code (repository root)

```
app/
├── page.tsx             # Homepage - needs refactor for Create/Join options
├── game/[matchId]/page.tsx  # Game page - add lobby code display, start game button

components/game/
├── match-setup.tsx      # Refactor to Create Game flow
├── lobby-join.tsx       # NEW - Join Lobby component
└── game-table.tsx       # Existing game table

convex/
├── schema.ts            # Add lobbyCode to matches table
├── matches.ts           # Add createWithCode, joinByCode, hostStart mutations
└── lib/store.ts         # May need snapshot updates for lobby info

lib/
└── anonymous-session.ts # Existing - no changes needed
```

**Structure Decision**: Next.js app with Convex backend. Refactor existing MatchSetup component, add new Join component, update game page for lobby code display and start button.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
