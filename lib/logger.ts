/**
 * Simple logging utility with different log levels
 * Integrates with Sentry for error tracking in production
 */

import * as Sentry from '@sentry/react-native';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = __DEV__;

class Logger {
    /**
     * Log debug information (only in development)
     */
    debug(message: string, ...args: any[]): void {
        if (isDevelopment) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }

    /**
     * Log informational messages
     */
    info(message: string, ...args: any[]): void {
        if (isDevelopment) {
            console.log(`[INFO] ${message}`, ...args);
        }
    }

    /**
     * Log warnings
     */
    warn(message: string, ...args: any[]): void {
        console.warn(`[WARN] ${message}`, ...args);
        if (!isDevelopment) {
            Sentry.captureMessage(message, 'warning');
        }
    }

    /**
     * Log errors and send to Sentry in production
     */
    error(message: string, error?: Error | any, ...args: any[]): void {
        console.error(`[ERROR] ${message}`, error, ...args);

        if (!isDevelopment) {
            if (error instanceof Error) {
                Sentry.captureException(error, {
                    extra: { message, ...args },
                });
            } else {
                Sentry.captureMessage(message, 'error');
            }
        }
    }

    /**
     * Add breadcrumb for debugging (sent with errors to Sentry)
     */
    breadcrumb(message: string, data?: Record<string, any>): void {
        if (!isDevelopment) {
            Sentry.addBreadcrumb({
                message,
                data,
                level: 'info',
            });
        }
    }
}

export const logger = new Logger();
