---
description: 'Comment philosophy, TypeScript formatting, and documentation standards'
---

# Comments, Types, and Documentation

This file defines the project's standards for comments, TypeScript formatting, and code documentation. The goal is clear, maintainable code that explains *why* decisions were made, not just *what* the code does.

## Comment Philosophy

Comments should explain **intent and reasoning**, not mechanics or what the code obviously does.

### Good Comments

**Explain the "why":** Reason behind a non-obvious decision, workaround, or design choice.

```ts
// We derive ratings from title hash to ensure determinism across builds.
// Math.random() would produce different values each time, breaking static output.
export function ratingFromTitle(title: string): number {
  const hash = simpleHash(title);
  return 3.0 + ((hash % 200) / 100); // range: 3.0–5.0
}
```

**Explain edge cases or constraints:**

```ts
// The games table uses text IDs (titles) instead of auto-increment integers
// because seeding is idempotent and matches on title. This ensures
// re-running db:seed doesn't create duplicates.
```

**Flag workarounds or technical debt:**

```ts
// TODO: After Drizzle 0.x.x lands, this join can be simplified
// because the ORM will support cross-schema relations.
```

### Bad Comments

**Restate obvious code:**

```ts
// ✗ Avoid: the code already says this
// Get all games from the database
const games = await getAllGames(db);

// ✗ Avoid: code is self-explanatory
// Loop through the games
for (const game of games) {
  // Increment the count
  count++;
}
```

**Outdated comments:**

```ts
// ✗ Avoid: comment doesn't match code
// Always returns the first game
export function getGameById(db: Database, id: number): Game | null {
  return db.query.games.findFirst({ where: { id } });
}
```

## TypeScript Formatting

Maintain consistent, readable TypeScript across the codebase.

### Type Annotations

Always provide explicit types for:
- **Function parameters and return values** — this is enforced by `npm run typecheck` (TypeScript 7/tsgo for `db/`, `src/lib/`, and configs; `npm run typecheck:astro` for `.astro` files).
- **Exported functions and variables** — especially in `db/` and `src/lib/`.
- **Class properties** — if a class is used.

```ts
// ✓ Good: explicit parameter and return types
export async function getAllGames(db: Database): Promise<Game[]> {
  // ...
}

// ✓ Good: explicit interface definition
interface GameFilter {
  categoryId?: number;
  minRating?: number;
}

// ✗ Avoid: implicit types (will fail typecheck)
export function getGames(db, filter) {
  // ...
}
```

### Imports and Exports

- Use ES modules (`import`/`export`) throughout.
- Named exports for functions and types; use `export default` only when exporting a single item (e.g., a layout or page).
- Group imports logically: third-party, project modules, then types.

```ts
// ✓ Good: organized imports
import { asc } from 'drizzle-orm';
import { getDatabase } from '../lib/db';
import type { Game } from '../types';
```

### Naming Conventions

- **Functions:** camelCase, verb-starting names (`getAllGames`, `getGameById`, `buildDescription`).
- **Constants:** UPPER_SNAKE_CASE for module-level constants (`MAX_RATING = 5.0`).
- **Types/Interfaces:** PascalCase (`Game`, `Publisher`, `GameFilter`).
- **Boolean properties/functions:** prefix with `is` or `has` (`isActive`, `hasCategory`).

## Documentation Standards

### Exported Functions (db/ and src/lib/)

Every exported function must include a JSDoc comment with:
- A brief description of purpose
- `@param` tags for each parameter (describe what the injectable `db` does)
- `@returns` tag describing the return value

```ts
/**
 * Fetches all games from the database, ordered alphabetically by title.
 * Ordering is deterministic to ensure consistent static builds.
 * 
 * @param db - The database client instance (injectable for testing)
 * @returns An array of game objects sorted by title, or an empty array if no games exist
 */
export async function getAllGames(db: Database): Promise<Game[]> {
  // ...
}
```

### Astro Component Props

Every reusable `.astro` component must document its `Props` interface:

```astro
---
import type { Game } from '../types';

interface Props {
  /** The game to display in the card. */
  game: Game;
  /** Optional CSS class to apply to the card container. */
  class?: string;
}

const { game, class: cardClass } = Astro.props;
---
```

### Inline Comments (Rare)

Use inline comments sparingly and only to explain non-obvious logic:

```ts
// ✓ Good: explains a tricky calculation
// Use bitwise XOR to combine hash values and get a stable seed
const combined = hash1 ^ hash2;
```

## Keeping Comments Current

Treat outdated comments as bugs:

- When you modify code, review and update its comments.
- If a comment no longer applies, delete it.
- In pull requests, flag comment-to-code mismatches in review.

## ESLint Enforcement

The project enforces code quality with ESLint:

```bash
npm run lint    # Check frontend code
```

ESLint rules include:
- **`no-console`** — Avoid `console.log()` in production code. Use for debugging only.
- **`@typescript-eslint/explicit-function-return-types`** — Function return types must be explicit (enforces the typing rules above).
- **`@typescript-eslint/no-unused-vars`** — Remove unused variables and imports.

Type checking runs separately:
```bash
npm run typecheck      # Pure TypeScript in db/, src/lib/, configs
npm run typecheck:astro # .astro files
npm run typecheck:all   # Both
```

Run these before committing to catch issues early.
