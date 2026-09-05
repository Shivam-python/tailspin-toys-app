import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getGamesByFilters,
    getAvailableCategories,
    getAvailablePublishers,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [strategyCategory] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [actionCategory] = await db
        .insert(categories)
        .values({ name: 'Action', description: 'cat' })
        .returning({ id: categories.id });
    const [pubOne] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });
    const [pubTwo] = await db
        .insert(publishers)
        .values({ name: 'Pub Two', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        const categoryId = i % 2 === 0 ? strategyCategory.id : actionCategory.id;
        const publisherId = i % 3 === 0 ? pubTwo.id : pubOne.id;
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId,
            publisherId,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: expect.any(String) });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: expect.any(String) });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    describe('filtering', () => {
        beforeEach(async () => {
            await seedGames(db, 6);
        });

        it('returns all games when no filters are provided', async () => {
            const result = await getGamesByFilters(db);
            expect(result).toHaveLength(6);
        });

        it('filters games by a single category', async () => {
            const allCategories = await getAvailableCategories(db);
            const categoryId = allCategories[0].id;
            const result = await getGamesByFilters(db, [categoryId]);
            expect(result.length).toBeGreaterThan(0);
            expect(result.every((g) => g.category?.id === categoryId)).toBe(true);
        });

        it('filters games by multiple categories (OR logic within categories)', async () => {
            const allCategories = await getAvailableCategories(db);
            const categoryIds = allCategories.slice(0, 2).map((c) => c.id);
            const result = await getGamesByFilters(db, categoryIds);
            expect(result.length).toBeGreaterThan(0);
            expect(result.every((g) => categoryIds.includes(g.category?.id ?? -1))).toBe(true);
        });

        it('filters games by a single publisher', async () => {
            const allPublishers = await getAvailablePublishers(db);
            const publisherId = allPublishers[0].id;
            const result = await getGamesByFilters(db, undefined, [publisherId]);
            expect(result.length).toBeGreaterThan(0);
            expect(result.every((g) => g.publisher?.id === publisherId)).toBe(true);
        });

        it('filters games by multiple publishers (OR logic within publishers)', async () => {
            const allPublishers = await getAvailablePublishers(db);
            const publisherIds = allPublishers.map((p) => p.id);
            const result = await getGamesByFilters(db, undefined, publisherIds);
            expect(result.length).toBeGreaterThan(0);
            expect(result.every((g) => publisherIds.includes(g.publisher?.id ?? -1))).toBe(true);
        });

        it('combines category and publisher filters with AND logic', async () => {
            const allCategories = await getAvailableCategories(db);
            const allPublishers = await getAvailablePublishers(db);
            const categoryId = allCategories[0].id;
            const publisherId = allPublishers[0].id;

            const result = await getGamesByFilters(db, [categoryId], [publisherId]);
            expect(result.every((g) => g.category?.id === categoryId && g.publisher?.id === publisherId)).toBe(true);
        });

        it('returns empty array when no games match filters', async () => {
            const result = await getGamesByFilters(db, [99999]);
            expect(result).toEqual([]);
        });

        it('returns games ordered by title when filters are applied', async () => {
            const result = await getGamesByFilters(db);
            const titles = result.map((g) => g.title);
            expect(titles).toEqual([...titles].sort());
        });
    });

    describe('category and publisher helpers', () => {
        beforeEach(async () => {
            await seedGames(db, 3);
        });

        it('returns all available categories ordered by name', async () => {
            const categories = await getAvailableCategories(db);
            expect(categories.length).toBeGreaterThan(0);
            expect(categories.every((c) => c.id && c.name)).toBe(true);
            const names = categories.map((c) => c.name);
            expect(names).toEqual([...names].sort());
        });

        it('returns all available publishers ordered by name', async () => {
            const publishers = await getAvailablePublishers(db);
            expect(publishers.length).toBeGreaterThan(0);
            expect(publishers.every((p) => p.id && p.name)).toBe(true);
            const names = publishers.map((p) => p.name);
            expect(names).toEqual([...names].sort());
        });
    });
});
