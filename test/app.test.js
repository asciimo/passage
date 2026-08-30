import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';

// Mock browser APIs before importing the classes
const mockElement = {
    innerHTML: '',
    addEventListener: () => {}
};

global.document = {
    addEventListener: () => {},
    getElementById: () => mockElement
};

// Default stub; resetTestState() reinstalls this before every test so a test
// that overrides matchMedia cannot leak its preference into later tests.
const defaultMatchMedia = (query) => ({
    matches: query.includes('reduce') ? false : true // Default to not reduced motion
});

global.window = {
    matchMedia: defaultMatchMedia
};

let rafCallbacks = [];
let rafId = 0;
global.requestAnimationFrame = (cb) => {
    rafId++;
    rafCallbacks[rafId] = cb;
    return rafId;
};

global.cancelAnimationFrame = (id) => {
    if (rafCallbacks[id]) {
        rafCallbacks[id] = null;
    }
};

global.requestAnimationFrame.resetMock = function() {
    rafCallbacks = [];
    rafId = 0;
};

global.requestAnimationFrame.getCallbacks = function() {
    return rafCallbacks;
};

let consoleLogs = [];
global.console = {
    log: (message) => consoleLogs.push(message),
    warn: (message) => consoleLogs.push(`WARN: ${message}`),
    error: (message) => consoleLogs.push(`ERROR: ${message}`),
    resetMock: function() {
        consoleLogs = [];
    },
    getLogs: function() {
        return consoleLogs;
    }
};

// Mock performance for time management
let mockTime = 1000;
global.performance = {
    now: () => mockTime,
    resetMock: function() {
        mockTime = 1000;
    },
    setTime: function(time) {
        mockTime = time;
    },
    getTime: function() {
        return mockTime;
    }
};

// Mock the global instances that the app depends on
const defaultGetElapsedSeconds = () => (global.performance.getTime() - 1000) / 1000;

global.timeManager = {
    getElapsedSeconds: defaultGetElapsedSeconds,
    getDeltaSeconds: () => 0.016,
    reset: () => {},
    resetMock: function() {
        // Tests override getElapsedSeconds to drive the clock; restore it so the
        // override does not carry into the next test.
        this.getElapsedSeconds = defaultGetElapsedSeconds;
    }
};

global.passageRenderer = {
    initialized: false,
    init: function() { this.initialized = true; },
    render: () => {},
    resetMock: function() {
        this.initialized = false;
    }
};

// Import the actual classes after setting up mocks
import { PassageApp } from '../app.js';

describe('PassageApp', () => {
    // Reset global state before each test. Every test must call this first —
    // the mocks are module-level singletons, so anything a test overrides
    // (matchMedia, the elapsed-time stub) otherwise persists into the next one.
    function resetTestState() {
        // Reset mocks using their reset methods
        global.performance.resetMock();
        global.requestAnimationFrame.resetMock();
        global.console.resetMock();
        global.timeManager.resetMock();
        global.passageRenderer.resetMock();
        global.window.matchMedia = defaultMatchMedia;
    }

    /**
     * Run one iteration of the app's RAF loop.
     */
    function tick(app) {
        const callbacks = global.requestAnimationFrame.getCallbacks();
        const callback = callbacks[app.animationFrameId];
        if (callback) {
            callback();
        }
    }

    /**
     * Elapsed-time logs emitted so far, e.g. ['Elapsed: 0s', 'Elapsed: 1s'].
     */
    function elapsedLogs() {
        return global.console.getLogs().filter(log => log.includes('Elapsed:'));
    }
    
    test('PassageApp can be instantiated', () => {
        resetTestState();
        
        const app = new PassageApp();
        assert.ok(app instanceof PassageApp, 'PassageApp should be instantiated correctly');
        assert.equal(app.isRunning, false, 'App should start in stopped state');
        assert.equal(app.animationFrameId, null, 'Animation frame ID should be null initially');
        assert.equal(typeof app.respectsReducedMotion, 'boolean', 'Should have reduced motion preference');
    });
    
    test('App can be started and stopped', () => {
        resetTestState();
        const app = new PassageApp();
        
        // Test start
        app.start();
        assert.equal(app.isRunning, true, 'App should be running after start');
        assert.ok(app.animationFrameId !== null, 'Animation frame ID should be set when running');
        
        // Test stop
        app.stop();
        assert.equal(app.isRunning, false, 'App should be stopped after stop');
        assert.equal(app.animationFrameId, null, 'Animation frame ID should be null after stop');
    });
    
    test('App initialization works correctly', () => {
        resetTestState();
        const app = new PassageApp();
        
        app.init();
        assert.equal(global.passageRenderer.initialized, true, 'PassageRenderer should be initialized');
    });
    
    test('App restart works correctly', () => {
        resetTestState();
        const app = new PassageApp();
        
        app.start();
        assert.equal(app.isRunning, true, 'App should be running');
        
        app.restart();
        assert.equal(app.isRunning, true, 'App should be running after restart');
    });
    
    test('App respects reduced motion preference', () => {
        resetTestState();

        // Mock reduced motion preference
        global.window.matchMedia = (query) => ({
            matches: query.includes('reduce') ? true : false
        });

        const app = new PassageApp();
        assert.equal(app.respectsReducedMotion, true, 'App should respect reduced motion preference');
    });
    
    test('App handles double start/stop gracefully', () => {
        resetTestState();
        const app = new PassageApp();
        
        // Double start should log warning
        app.start();
        app.start();
        assert.equal(app.isRunning, true, 'App should still be running after double start');
        assert.ok(global.console.getLogs().some(log => log.includes('already running')), 'Should warn about double start');
        
        // Double stop should log warning
        global.console.resetMock(); // Reset logs
        app.stop();
        app.stop();
        assert.equal(app.isRunning, false, 'App should still be stopped after double stop');
        assert.ok(global.console.getLogs().some(log => log.includes('not running')), 'Should warn about double stop');
    });
    
    test('App loop logs elapsed time', () => {
        resetTestState();
        const app = new PassageApp();

        global.performance.setTime(1000);
        app.start(); // start() runs the first iteration itself

        assert.deepEqual(elapsedLogs(), ['Elapsed: 0s'], 'Should log elapsed time on the first frame');

        app.stop();
    });

    test('App logs at most once per whole second', () => {
        resetTestState();
        const app = new PassageApp();

        global.performance.setTime(1000);
        app.start();

        // Four more frames within the same second should not log again
        for (const time of [1016, 1032, 1500, 1999]) {
            global.performance.setTime(time);
            tick(app);
        }
        assert.deepEqual(
            elapsedLogs(),
            ['Elapsed: 0s'],
            'Frames within the same second should not log again'
        );

        // Crossing into the next second logs exactly once more
        global.performance.setTime(2000);
        tick(app);
        global.performance.setTime(2500);
        tick(app);
        assert.deepEqual(
            elapsedLogs(),
            ['Elapsed: 0s', 'Elapsed: 1s'],
            'Crossing a second boundary should log exactly once'
        );

        app.stop();
    });

    test('App logs regardless of reduced motion preference', () => {
        resetTestState();

        // Reduced motion governs animation, not console output
        global.window.matchMedia = () => ({ matches: true });
        const app = new PassageApp();

        global.performance.setTime(1000);
        app.start();

        assert.deepEqual(
            elapsedLogs(),
            ['Elapsed: 0s'],
            'Reduced-motion users should still get elapsed-time output'
        );

        app.stop();
    });

    test('Restart resets the log throttle', () => {
        resetTestState();
        const app = new PassageApp();

        global.performance.setTime(1000);
        app.start();
        global.performance.setTime(5000); // 4 seconds later
        tick(app);
        assert.deepEqual(elapsedLogs(), ['Elapsed: 0s', 'Elapsed: 4s']);

        // timeManager.reset() is stubbed, so drive the clock back to the origin
        // to mimic a real reset before restarting.
        global.performance.setTime(1000);
        app.restart();
        assert.deepEqual(
            elapsedLogs(),
            ['Elapsed: 0s', 'Elapsed: 4s', 'Elapsed: 0s'],
            'Restart should log second 0 again rather than suppressing it'
        );

        app.stop();
    });
});