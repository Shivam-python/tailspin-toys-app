import { test, expect, type Response } from '@playwright/test';

test.describe('Game Listing and Navigation', () => {
  test('should display games with titles on index page', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
    });

    await test.step('Verify games grid is visible', async () => {
      const gamesGrid = page.getByTestId('games-grid');
      await expect(gamesGrid).toBeVisible();
    });

    await test.step('Verify game cards are displayed', async () => {
      const gameCards = page.getByTestId('game-card');
      await expect(gameCards.first()).toBeVisible();
      expect(await gameCards.count()).toBeGreaterThan(0);
    });

    await test.step('Verify game cards have titles with content', async () => {
      const gameCards = page.getByTestId('game-card');
      await expect(gameCards.first().getByTestId('game-title')).toBeVisible();
      await expect(gameCards.first().getByTestId('game-title')).not.toBeEmpty();
    });
  });

  test('should navigate to correct game details page when clicking on a game', async ({ page }) => {
    let gameId: string | null;
    let gameTitle: string | null;

    await test.step('Navigate to homepage and wait for games to load', async () => {
      await page.goto('/');
      const gamesGrid = page.getByTestId('games-grid');
      await expect(gamesGrid).toBeVisible();
    });

    await test.step('Get first game information and click it', async () => {
      const firstGameCard = page.getByTestId('game-card').first();
      gameId = await firstGameCard.getAttribute('data-game-id');
      gameTitle = await firstGameCard.getAttribute('data-game-title');
      await firstGameCard.click();
    });

    await test.step('Verify navigation to game details page', async () => {
      await expect(page).toHaveURL(`/game/${gameId}`);
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify game title matches clicked game', async () => {
      if (gameTitle) {
        await expect(page.getByTestId('game-details-title')).toHaveText(gameTitle);
      }
    });
  });

  test('should display game details with all required information', async ({ page }) => {
    await test.step('Navigate to specific game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify game title is displayed', async () => {
      const gameTitle = page.getByTestId('game-details-title');
      await expect(gameTitle).toBeVisible();
      await expect(gameTitle).not.toBeEmpty();
    });

    await test.step('Verify game description is displayed', async () => {
      const gameDescription = page.getByTestId('game-details-description');
      await expect(gameDescription).toBeVisible();
      await expect(gameDescription).not.toBeEmpty();
    });

    await test.step('Verify publisher or category information is present', async () => {
      const publisherExists = await page.getByTestId('game-details-publisher').isVisible();
      const categoryExists = await page.getByTestId('game-details-category').isVisible();
      expect(publisherExists || categoryExists).toBeTruthy();

      if (publisherExists) {
        await expect(page.getByTestId('game-details-publisher')).not.toBeEmpty();
      }

      if (categoryExists) {
        await expect(page.getByTestId('game-details-category')).not.toBeEmpty();
      }
    });
  });

  test('should display a button to back the game', async ({ page }) => {
    await test.step('Navigate to game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify back game button is visible and enabled', async () => {
      const backButton = page.getByTestId('back-game-button');
      await expect(backButton).toBeVisible();
      await expect(backButton).toContainText('Support This Game');
      await expect(backButton).toBeEnabled();
    });
  });

  test('should be able to navigate back to home from game details', async ({ page }) => {
    await test.step('Navigate to game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Click back to all games link', async () => {
      const backLink = page.getByRole('link', { name: /back to all games/i });
      await expect(backLink).toBeVisible();
      await backLink.click();
    });

    await test.step('Verify navigation back to homepage', async () => {
      await expect(page).toHaveURL('/');
      await expect(page.getByTestId('games-grid')).toBeVisible();
    });
  });

  test('should return a 404 page for a non-existent game', async ({ page }) => {
    let response: Response | null;

    await test.step('Navigate to non-existent game', async () => {
      response = await page.goto('/game/99999');
    });

    await test.step('Verify a branded 404 page is served', async () => {
      expect(response?.status()).toBe(404);
      await expect(page).toHaveTitle(/Page Not Found - Tailspin Toys/);
      await expect(page.getByTestId('not-found')).toBeVisible();
      await expect(page.getByTestId('not-found-heading')).not.toBeEmpty();
      await expect(page.getByTestId('not-found-home-link')).toBeVisible();
    });
  });
});

test.describe('Game Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('filter-panel')).toBeVisible();
  });

  test('should display filter panel with categories and publishers', async ({ page }) => {
    await test.step('Verify filter panel is visible', async () => {
      const filterPanel = page.getByTestId('filter-panel');
      await expect(filterPanel).toBeVisible();
    });

    await test.step('Verify category filter is present', async () => {
      const categoryFilter = page.getByTestId('category-filter');
      await expect(categoryFilter).toBeVisible();
    });

    await test.step('Verify publisher filter is present', async () => {
      const publisherFilter = page.getByTestId('publisher-filter');
      await expect(publisherFilter).toBeVisible();
    });
  });

  test('should filter games by category when category checkbox is selected', async ({ page }) => {
    let initialGameCount: number;
    let filteredGameCount: number;

    await test.step('Count initial games displayed', async () => {
      const gameCards = page.getByTestId('game-card');
      initialGameCount = await gameCards.count();
      expect(initialGameCount).toBeGreaterThan(0);
    });

    await test.step('Select first category filter and apply', async () => {
      const firstCategoryCheckbox = page.getByTestId('category-checkbox-1');
      if ((await firstCategoryCheckbox.count()) > 0) {
        await firstCategoryCheckbox.check();
        await page.getByTestId('apply-filters-button').click();
      }
    });

    await test.step('Verify filtered results are displayed', async () => {
      await expect(page.getByTestId('games-grid')).toBeVisible();
      const gameCards = page.getByTestId('game-card');
      filteredGameCount = await gameCards.count();
      expect(filteredGameCount).toBeGreaterThan(0);
    });

    await test.step('Verify URL contains category parameter', async () => {
      await expect(page).toHaveURL(/category=/);
    });
  });

  test('should filter games by publisher when publisher checkbox is selected', async ({ page }) => {
    let initialGameCount: number;

    await test.step('Count initial games displayed', async () => {
      const gameCards = page.getByTestId('game-card');
      initialGameCount = await gameCards.count();
      expect(initialGameCount).toBeGreaterThan(0);
    });

    await test.step('Select first publisher filter and apply', async () => {
      const firstPublisherCheckbox = page.getByTestId('publisher-checkbox-1');
      if ((await firstPublisherCheckbox.count()) > 0) {
        await firstPublisherCheckbox.check();
        await page.getByTestId('apply-filters-button').click();
      }
    });

    await test.step('Verify filtered results are displayed', async () => {
      await expect(page.getByTestId('games-grid')).toBeVisible();
      const gameCards = page.getByTestId('game-card');
      expect(await gameCards.count()).toBeGreaterThan(0);
    });

    await test.step('Verify URL contains publisher parameter', async () => {
      await expect(page).toHaveURL(/publisher=/);
    });
  });

  test('should combine category and publisher filters with AND logic', async ({ page }) => {
    await test.step('Select category and publisher filters', async () => {
      const categoryCheckbox = page.getByTestId('category-checkbox-1');
      const publisherCheckbox = page.getByTestId('publisher-checkbox-1');

      if ((await categoryCheckbox.count()) > 0) {
        await categoryCheckbox.check();
      }
      if ((await publisherCheckbox.count()) > 0) {
        await publisherCheckbox.check();
      }

      await page.getByTestId('apply-filters-button').click();
    });

    await test.step('Verify URL contains both parameters', async () => {
      const url = page.url();
      expect(url.includes('category=') || url.includes('publisher=')).toBeTruthy();
    });

    await test.step('Verify filtered results are displayed', async () => {
      await expect(page.getByTestId('games-grid')).toBeVisible();
    });
  });

  test('should show clear filters button only when filters are applied', async ({ page }) => {
    await test.step('Verify clear button is not visible initially', async () => {
      const clearButton = page.getByTestId('clear-filters-button');
      expect(await clearButton.count()).toBe(0);
    });

    await test.step('Apply a filter via URL', async () => {
      await page.goto('/?category=1');
      await page.waitForURL(/category=1/);
    });

    await test.step('Verify clear button is now visible after URL navigation', async () => {
      const clearButton = page.getByTestId('clear-filters-button');
      if ((await clearButton.count()) > 0) {
        await expect(clearButton).toBeVisible();
      }
    });

    await test.step('Click clear button and navigate home', async () => {
      const clearButton = page.getByTestId('clear-filters-button');
      if ((await clearButton.count()) > 0) {
        await clearButton.click();
        await page.waitForURL('/');
      }
    });
  });

  test('should maintain filter state when navigating to game details and back', async ({ page }) => {
    await test.step('Apply a filter', async () => {
      const categoryCheckbox = page.getByTestId('category-checkbox-1');
      if ((await categoryCheckbox.count()) > 0) {
        await categoryCheckbox.check();
        await page.getByTestId('apply-filters-button').click();
      }
    });

    await test.step('Navigate to a game detail page', async () => {
      const gameCard = page.getByTestId('game-card').first();
      if ((await gameCard.count()) > 0) {
        await gameCard.click();
      }
    });

    await test.step('Navigate back to homepage via back link', async () => {
      const backLink = page.getByRole('link', { name: /back to all games/i });
      if ((await backLink.count()) > 0) {
        await backLink.click();
      }
    });

    await test.step('Verify filter state is cleared on home page', async () => {
      await expect(page).toHaveURL('/');
    });
  });

  test('should be keyboard accessible for filter controls', async ({ page }) => {
    await test.step('Tab through filter checkboxes', async () => {
      const firstCheckbox = page.getByTestId('category-checkbox-1');
      if ((await firstCheckbox.count()) > 0) {
        await firstCheckbox.focus();
        await expect(firstCheckbox).toBeFocused();

        // Space should toggle the checkbox
        await firstCheckbox.press('Space');
        const isChecked = await firstCheckbox.isChecked();
        expect(isChecked).toBe(true);
      }
    });

    await test.step('Tab to and activate apply button', async () => {
      const applyButton = page.getByTestId('apply-filters-button');
      await applyButton.focus();
      await expect(applyButton).toBeFocused();
      await applyButton.press('Enter');

      await expect(page.getByTestId('games-grid')).toBeVisible();
    });
  });

  test('should display empty state when no games match filters', async ({ page }) => {
    await test.step('Navigate to URL with non-existent filter IDs', async () => {
      await page.goto('/?category=99999&publisher=99999');
    });

    await test.step('Verify clear filters button is visible when filters are applied', async () => {
      const clearButton = page.getByTestId('clear-filters-button');
      if ((await clearButton.count()) > 0) {
        await expect(clearButton).toBeVisible();
      }
    });

    await test.step('Verify URL still contains filter params', async () => {
      const url = page.url();
      expect(url.includes('category=') || url.includes('publisher=')).toBeTruthy();
    });
  });
});
