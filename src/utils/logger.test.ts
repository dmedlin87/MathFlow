import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger, LogLevel } from './logger';

describe('Logger', () => {
    // Spies for console methods
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should log INFO messages to console.log', () => {
        logger.info('Test info message', { userId: 123 });

        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const logCall = consoleLogSpy.mock.calls[0][0];
        const entry = JSON.parse(logCall);

        expect(entry).toMatchObject({
            level: LogLevel.INFO,
            message: 'Test info message',
            context: { userId: 123 }
        });
        expect(entry.timestamp).toBeDefined();
    });

    it('should log WARN messages to console.warn', () => {
        logger.warn('Test warn message');

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        const logCall = consoleWarnSpy.mock.calls[0][0];
        const entry = JSON.parse(logCall);

        expect(entry).toMatchObject({
            level: LogLevel.WARN,
            message: 'Test warn message'
        });
    });

    it('should log ERROR messages to console.error', () => {
        logger.error('Test error message', { error: 'something bad' });

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        const logCall = consoleErrorSpy.mock.calls[0][0];
        const entry = JSON.parse(logCall);

        expect(entry).toMatchObject({
            level: LogLevel.ERROR,
            message: 'Test error message',
            context: { error: 'something bad' }
        });
    });

    it('should log DEBUG messages to console.log', () => {
        logger.debug('Test debug message');

        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const logCall = consoleLogSpy.mock.calls[0][0]; // Note: index 0 if it's the first call
        const entry = JSON.parse(logCall);

        expect(entry).toMatchObject({
            level: LogLevel.DEBUG,
            message: 'Test debug message'
        });
    });

    it('should handle missing context gracefully', () => {
        logger.info('No context');
        const entry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
        expect(entry.context).toBeUndefined();
    });
});
