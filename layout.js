/**
 * Time→squares mapping and auto cadence (PSG-04).
 *
 * Pure geometry and arithmetic: given a session duration and a viewport, work
 * out how many squares the session is worth, how often one falls, and how big
 * the grid cells are. No DOM, no clock, no storage — every function here is
 * deterministic, because PSG-03's erosion order depends on the same inputs
 * always producing the same grid.
 *
 * Unlike time.js and passage.js, this module exports plain functions rather
 * than assigning a singleton to globalThis. There is no instance state to
 * share, so consumers import it normally.
 */

const HOUR_SECONDS = 3600;

/** Cadence tiers, in seconds per square. */
export const CADENCE = {
    LONG: 10,  // >= 4h
    MEDIUM: 6, // 1h - 4h (spec allows 6-8; 6 is the default)
    SHORT: 3   // < 1h
};

/** Smallest unit size we will ever render, in CSS pixels. */
export const MIN_UNIT_PX = 12;

/** Preferred unit size before any shrinking to fit. */
export const DEFAULT_UNIT_PX = 16;

/**
 * Rows of empty space kept above the grid so a falling square has somewhere to
 * fall from. Expressed in units rather than pixels so it scales with the grid.
 */
export const FALL_GAP_UNITS = 2;

/** Upper bound on cadence escalation, so an extreme viewport cannot loop forever. */
export const MAX_CADENCE = 60;

/**
 * Seconds per square for a session of the given length.
 *
 * @param {number} durationSec - Session length in seconds.
 * @returns {number} Cadence in seconds per square.
 */
export function computeCadence(durationSec) {
    if (!(durationSec > 0)) {
        throw new RangeError(`durationSec must be a positive number, got ${durationSec}`);
    }

    if (durationSec >= 4 * HOUR_SECONDS) {
        return CADENCE.LONG;
    }
    if (durationSec >= HOUR_SECONDS) {
        return CADENCE.MEDIUM;
    }
    return CADENCE.SHORT;
}

/**
 * Total squares a session is worth at a given cadence.
 *
 * @param {number} durationSec - Session length in seconds.
 * @param {number} cadenceSec - Seconds per square.
 * @returns {number} Square count.
 */
export function computeSquareCount(durationSec, cadenceSec) {
    return Math.ceil(durationSec / cadenceSec);
}

/**
 * Grid dimensions for `squareCount` squares at unit size `unitPx`.
 *
 * @returns {{columns: number, rows: number}}
 */
export function computeGrid(squareCount, unitPx, viewportWidth) {
    const columns = Math.max(1, Math.floor(viewportWidth / unitPx));
    const rows = Math.ceil(squareCount / columns);
    return { columns, rows };
}

/**
 * Whether a grid of `rows` rows at `unitPx` leaves room for the fall gap.
 *
 * The reservoir drains as the pile grows, so the two together never need more
 * than `rows` rows at once — plus a gap above for squares in flight.
 */
export function fitsInViewport(rows, unitPx, viewportHeight) {
    return (rows + FALL_GAP_UNITS) * unitPx <= viewportHeight;
}

/**
 * Full layout for a session: cadence, square count, unit size, and grid.
 *
 * Squares are sized as large as will fit. When the grid overflows the viewport
 * we first shrink the unit down to MIN_UNIT_PX (more columns, so fewer rows),
 * and only if that is still too tall do we slow the cadence, which produces
 * fewer squares overall.
 *
 * @param {object} options
 * @param {number} options.durationSec - Session length in seconds.
 * @param {number} options.viewportWidth - Usable width in CSS pixels.
 * @param {number} options.viewportHeight - Usable height in CSS pixels.
 * @param {number} [options.minUnitPx] - Floor for unit size.
 * @param {number} [options.preferredUnitPx] - Starting unit size.
 * @returns {{squareCount: number, cadenceSec: number, unitPx: number, columns: number, rows: number}}
 */
export function computeLayout({
    durationSec,
    viewportWidth,
    viewportHeight,
    minUnitPx = MIN_UNIT_PX,
    preferredUnitPx = DEFAULT_UNIT_PX
} = {}) {
    if (!(viewportWidth > 0) || !(viewportHeight > 0)) {
        throw new RangeError(
            `viewport must have positive dimensions, got ${viewportWidth}x${viewportHeight}`
        );
    }

    const unitFloor = Math.max(1, Math.floor(minUnitPx));
    const unitCeiling = Math.max(unitFloor, Math.floor(preferredUnitPx));

    let cadenceSec = computeCadence(durationSec);

    // Slow the cadence only after every unit size has been tried and failed.
    while (cadenceSec <= MAX_CADENCE) {
        const squareCount = computeSquareCount(durationSec, cadenceSec);

        for (let unitPx = unitCeiling; unitPx >= unitFloor; unitPx--) {
            const { columns, rows } = computeGrid(squareCount, unitPx, viewportWidth);
            if (fitsInViewport(rows, unitPx, viewportHeight)) {
                return { squareCount, cadenceSec, unitPx, columns, rows };
            }
        }

        cadenceSec++;
    }

    // Nothing fits even at the slowest cadence: return the smallest, slowest
    // grid we know how to build rather than failing outright, so the caller
    // still gets a renderable (if cramped) layout.
    const squareCount = computeSquareCount(durationSec, MAX_CADENCE);
    const { columns, rows } = computeGrid(squareCount, unitFloor, viewportWidth);
    return { squareCount, cadenceSec: MAX_CADENCE, unitPx: unitFloor, columns, rows };
}
