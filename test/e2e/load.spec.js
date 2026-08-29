import { test, expect } from '@playwright/test';

/**
 * PSG-01 acceptance criteria: the app loads without console errors, and a
 * single RAF loop runs and logs elapsed seconds.
 */

/**
 * Attach console/page error collectors before navigation so nothing is missed.
 */
function collectErrors(page) {
    const errors = [];
    page.on('console', (message) => {
        if (message.type() === 'error') {
            errors.push(`console: ${message.text()}`);
        }
    });
    page.on('pageerror', (error) => {
        errors.push(`pageerror: ${error.message}`);
    });
    return errors;
}

test('app loads without console errors', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/');

    await expect(page.locator('#app h1')).toHaveText('Passage');
    expect(errors).toEqual([]);
});

test('modules load and expose their singletons', async ({ page }) => {
    await page.goto('/');

    // Guards the dual global/export pattern: app.js reads these as bare globals
    // rather than importing them, so a change in index.html's script order
    // would break the app silently.
    const globals = await page.evaluate(() => ({
        timeManager: typeof globalThis.timeManager,
        passageRenderer: typeof globalThis.passageRenderer
    }));

    expect(globals).toEqual({ timeManager: 'object', passageRenderer: 'object' });
});

test('RAF loop logs elapsed seconds at most once per second', async ({ page }) => {
    const logs = [];
    page.on('console', (message) => {
        if (message.type() === 'log' && message.text().startsWith('Elapsed:')) {
            logs.push(message.text());
        }
    });

    await page.goto('/');

    // Wait for the loop to cross a second boundary rather than sleeping blindly.
    await expect.poll(() => logs.length, { timeout: 5000 }).toBeGreaterThanOrEqual(2);

    // Throttling holds: a 60Hz loop would have produced hundreds of lines here.
    expect(logs.length).toBeLessThan(10);
    expect(logs[0]).toBe('Elapsed: 0s');
    expect(new Set(logs).size).toBe(logs.length); // no duplicate seconds
});
