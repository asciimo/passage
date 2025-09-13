import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { TimeManager } from '../time.js';

// Mock performance.now for testing
let mockTime = 1000;
global.performance = {
    now: () => mockTime
};

describe('TimeManager', () => {
    test('TimeManager can be instantiated', () => {
        const timeManager = new TimeManager();
        assert.ok(timeManager instanceof TimeManager, 'TimeManager should be instantiated correctly');
        assert.ok(typeof timeManager.startTime === 'number', 'Should have a numeric startTime');
        assert.ok(typeof timeManager.lastTime === 'number', 'Should have a numeric lastTime');
    });
    
    test('getElapsedSeconds returns correct elapsed time', () => {
        mockTime = 1000;
        const timeManager = new TimeManager();
        
        mockTime = 2500; // 1.5 seconds later
        const elapsed = timeManager.getElapsedSeconds();
        
        assert.equal(elapsed, 1.5, 'Should return 1.5 seconds elapsed');
    });
    
    test('getDeltaSeconds returns correct delta time', () => {
        mockTime = 1000;
        const timeManager = new TimeManager();
        
        mockTime = 1016; // 16ms later (typical frame time)
        const delta = timeManager.getDeltaSeconds();
        
        assert.equal(delta, 0.016, 'Should return 0.016 seconds delta');
    });
    
    test('reset() resets the timer correctly', () => {
        mockTime = 1000;
        const timeManager = new TimeManager();
        
        mockTime = 2000; // 1 second later
        assert.equal(timeManager.getElapsedSeconds(), 1, 'Should show 1 second elapsed');
        
        timeManager.reset();
        assert.equal(timeManager.getElapsedSeconds(), 0, 'Should reset to 0 elapsed time');
    });
    
    test('getDeltaSeconds updates lastTime correctly', () => {
        mockTime = 1000;
        const timeManager = new TimeManager();
        
        mockTime = 1016;
        const firstDelta = timeManager.getDeltaSeconds();
        assert.equal(firstDelta, 0.016, 'First delta should be 0.016');
        
        mockTime = 1032; // Another 16ms
        const secondDelta = timeManager.getDeltaSeconds();
        assert.equal(secondDelta, 0.016, 'Second delta should also be 0.016');
    });
    
    test('consecutive calls to getDeltaSeconds give correct deltas', () => {
        mockTime = 1000;
        const timeManager = new TimeManager();
        
        // First call establishes baseline
        mockTime = 1100; // 100ms later
        const delta1 = timeManager.getDeltaSeconds();
        assert.equal(delta1, 0.1, 'First delta should be 0.1 seconds');
        
        // Second call should measure from last call
        mockTime = 1150; // 50ms later
        const delta2 = timeManager.getDeltaSeconds();
        assert.equal(delta2, 0.05, 'Second delta should be 0.05 seconds');
    });
});