import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import {
    CADENCE,
    DEFAULT_UNIT_PX,
    FALL_GAP_UNITS,
    MAX_CADENCE,
    MIN_UNIT_PX,
    computeCadence,
    computeGrid,
    computeLayout,
    computeSquareCount,
    fitsInViewport
} from '../layout.js';

const HOUR = 3600;

// A desktop viewport roomy enough that nothing has to shrink.
const ROOMY = { viewportWidth: 1920, viewportHeight: 1080 };

describe('computeCadence', () => {
    const cases = [
        { label: '6 hours', durationSec: 6 * HOUR, expected: CADENCE.LONG },
        { label: 'exactly 4 hours', durationSec: 4 * HOUR, expected: CADENCE.LONG },
        { label: 'one second under 4 hours', durationSec: 4 * HOUR - 1, expected: CADENCE.MEDIUM },
        { label: '2 hours', durationSec: 2 * HOUR, expected: CADENCE.MEDIUM },
        { label: 'exactly 1 hour', durationSec: HOUR, expected: CADENCE.MEDIUM },
        { label: 'one second under 1 hour', durationSec: HOUR - 1, expected: CADENCE.SHORT },
        { label: '25 minutes', durationSec: 25 * 60, expected: CADENCE.SHORT },
        { label: '1 second', durationSec: 1, expected: CADENCE.SHORT }
    ];

    for (const { label, durationSec, expected } of cases) {
        test(`${label} → ${expected}s per square`, () => {
            assert.equal(computeCadence(durationSec), expected);
        });
    }

    test('rejects non-positive durations', () => {
        for (const bad of [0, -1, NaN, undefined]) {
            assert.throws(() => computeCadence(bad), RangeError, `should reject ${bad}`);
        }
    });
});

describe('computeSquareCount', () => {
    test('6 hours at 10s per square is 2160 squares', () => {
        assert.equal(computeSquareCount(6 * HOUR, CADENCE.LONG), 2160);
    });

    test('rounds up so the final partial square still appears', () => {
        assert.equal(computeSquareCount(25, 10), 3);
    });
});

describe('computeGrid', () => {
    test('fills columns across the viewport, then wraps into rows', () => {
        assert.deepEqual(computeGrid(100, 10, 200), { columns: 20, rows: 5 });
    });

    test('always leaves at least one column, even in a sliver of a viewport', () => {
        const { columns, rows } = computeGrid(10, 12, 4);
        assert.equal(columns, 1);
        assert.equal(rows, 10);
    });
});

describe('fitsInViewport', () => {
    test('accounts for the fall gap above the grid', () => {
        const rows = 10;
        const unitPx = 10;
        const exact = (rows + FALL_GAP_UNITS) * unitPx;

        assert.equal(fitsInViewport(rows, unitPx, exact), true, 'exact fit should pass');
        assert.equal(fitsInViewport(rows, unitPx, exact - 1), false, 'one pixel short should fail');
    });
});

describe('computeLayout', () => {
    test('6h focus window meets the PSG-04 acceptance criteria', () => {
        const layout = computeLayout({ durationSec: 6 * HOUR, ...ROOMY });

        assert.equal(layout.squareCount, 2160, 'S should be 2160');
        assert.equal(layout.cadenceSec, 10, 'f should be 10s');
        assert.ok(layout.unitPx >= 12, `units should be >= 12px, got ${layout.unitPx}`);
    });

    test('uses the preferred unit size when there is room', () => {
        const layout = computeLayout({ durationSec: 6 * HOUR, ...ROOMY });
        assert.equal(layout.unitPx, DEFAULT_UNIT_PX);
    });

    test('shrinks the unit before touching the cadence', () => {
        // Tall enough to fit once squares get smaller, but not at 16px.
        const layout = computeLayout({
            durationSec: 6 * HOUR,
            viewportWidth: 1200,
            viewportHeight: 420
        });

        assert.ok(layout.unitPx < DEFAULT_UNIT_PX, 'should have shrunk the unit');
        assert.ok(layout.unitPx >= MIN_UNIT_PX, 'should not go below the floor');
        assert.equal(layout.cadenceSec, CADENCE.LONG, 'cadence should be untouched');
        assert.equal(layout.squareCount, 2160, 'square count should be untouched');
    });

    test('slows the cadence only once the unit floor is reached', () => {
        const layout = computeLayout({
            durationSec: 6 * HOUR,
            viewportWidth: 800,
            viewportHeight: 400
        });

        assert.equal(layout.unitPx, MIN_UNIT_PX, 'should be at the unit floor');
        assert.ok(
            layout.cadenceSec > CADENCE.LONG,
            `cadence should have increased, got ${layout.cadenceSec}`
        );
        assert.ok(
            layout.squareCount < 2160,
            `slower cadence should mean fewer squares, got ${layout.squareCount}`
        );
    });

    test('honours a caller-supplied unit floor', () => {
        const layout = computeLayout({
            durationSec: 6 * HOUR,
            viewportWidth: 800,
            viewportHeight: 400,
            minUnitPx: 20
        });

        assert.ok(layout.unitPx >= 20, `should respect the 20px floor, got ${layout.unitPx}`);
    });

    test('never exceeds the cadence cap, even in an unusable viewport', () => {
        const layout = computeLayout({
            durationSec: 24 * HOUR,
            viewportWidth: 40,
            viewportHeight: 40
        });

        assert.ok(layout.cadenceSec <= MAX_CADENCE, 'cadence should be capped');
        assert.equal(layout.unitPx, MIN_UNIT_PX);
        assert.ok(layout.columns >= 1, 'should still offer at least one column');
    });

    test('rejects a viewport with no area', () => {
        for (const bad of [
            { viewportWidth: 0, viewportHeight: 1080 },
            { viewportWidth: 1920, viewportHeight: 0 }
        ]) {
            assert.throws(
                () => computeLayout({ durationSec: 6 * HOUR, ...bad }),
                RangeError
            );
        }
    });

    describe('invariants hold across a range of sessions and viewports', () => {
        const durations = [15 * 60, HOUR, 2 * HOUR, 4 * HOUR, 6 * HOUR, 12 * HOUR];
        const viewports = [
            { viewportWidth: 1920, viewportHeight: 1080 },
            { viewportWidth: 1366, viewportHeight: 768 },
            { viewportWidth: 800, viewportHeight: 600 },
            { viewportWidth: 390, viewportHeight: 844 }
        ];

        for (const durationSec of durations) {
            for (const viewport of viewports) {
                const label = `${durationSec}s at ${viewport.viewportWidth}x${viewport.viewportHeight}`;

                test(label, () => {
                    const layout = computeLayout({ durationSec, ...viewport });

                    assert.ok(layout.unitPx >= MIN_UNIT_PX, 'unit at or above the floor');
                    assert.ok(layout.columns >= 1, 'at least one column');
                    assert.ok(
                        layout.columns * layout.rows >= layout.squareCount,
                        'grid holds every square'
                    );
                    assert.ok(
                        fitsInViewport(layout.rows, layout.unitPx, viewport.viewportHeight),
                        'grid plus fall gap fits the viewport'
                    );
                    assert.ok(
                        layout.columns * layout.unitPx <= viewport.viewportWidth,
                        'columns fit the viewport width'
                    );
                });
            }
        }
    });

    test('is deterministic for identical inputs', () => {
        const options = { durationSec: 6 * HOUR, viewportWidth: 1024, viewportHeight: 500 };
        assert.deepEqual(computeLayout(options), computeLayout(options));
    });
});
