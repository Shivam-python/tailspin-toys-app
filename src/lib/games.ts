import { eq, asc, inArray, and } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game, Category, Publisher } from '../types/game';

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/**
 * Fetches all games from the database, ordered alphabetically by title.
 * Ordering is deterministic to ensure consistent static builds.
 *
 * @param db - The database client instance (injectable for testing)
 * @returns An array of all games ordered by title
 */
export async function getAllGames(db: Database): Promise<Game[]> {
    const rows = await baseGamesQuery(db).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/**
 * Fetches all game IDs from the database, ordered alphabetically by title.
 * Useful for generating static routes (e.g., `/game/[id]`).
 *
 * @param db - The database client instance (injectable for testing)
 * @returns An array of game IDs ordered by title
 */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/**
 * Fetches a single game by ID, or null if it does not exist.
 *
 * @param db - The database client instance (injectable for testing)
 * @param id - The game ID to fetch
 * @returns The game object, or null if not found
 */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}

/**
 * Fetches games filtered by one or more categories and/or publishers.
 * When multiple filters are provided, they are combined with AND logic
 * (only games matching all provided criteria are returned).
 *
 * @param db - The database client instance (injectable for testing)
 * @param categoryIds - Optional array of category IDs to filter by
 * @param publisherIds - Optional array of publisher IDs to filter by
 * @returns An array of filtered games ordered by title, or an empty array if no matches
 */
export async function getGamesByFilters(
    db: Database,
    categoryIds?: number[],
    publisherIds?: number[],
): Promise<Game[]> {
    const conditions: Array<ReturnType<typeof inArray>> = [];

    if (categoryIds && categoryIds.length > 0) {
        conditions.push(inArray(games.categoryId, categoryIds));
    }

    if (publisherIds && publisherIds.length > 0) {
        conditions.push(inArray(games.publisherId, publisherIds));
    }

    const query = db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id))
        .where(
            conditions.length > 0 ? and(...conditions) : undefined
        );

    const rows = await query.orderBy(asc(games.title));
    return rows.map(mapGame);
}

/**
 * Fetches all available categories ordered alphabetically by name.
 * Used to populate category filter options in the UI.
 *
 * @param db - The database client instance (injectable for testing)
 * @returns An array of categories with id and name, ordered by name
 */
export async function getAvailableCategories(db: Database): Promise<Category[]> {
    const rows = await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name));
    return rows;
}

/**
 * Fetches all available publishers ordered alphabetically by name.
 * Used to populate publisher filter options in the UI.
 *
 * @param db - The database client instance (injectable for testing)
 * @returns An array of publishers with id and name, ordered by name
 */
export async function getAvailablePublishers(db: Database): Promise<Publisher[]> {
    const rows = await db.select({ id: publishers.id, name: publishers.name }).from(publishers).orderBy(asc(publishers.name));
    return rows;
}
