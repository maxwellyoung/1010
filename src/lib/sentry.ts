import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/**
 * Sentry Error Tracking
 *
 * Initialize Sentry for error monitoring and performance tracking.
 * Configure DSN in app.json under expo.extra.sentryDsn
 */

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn;

export const isSentryConfigured = !!SENTRY_DSN;

export function initSentry() {
    if (!isSentryConfigured) {
        console.log('[SENTRY] Not configured - skipping initialization');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        debug: __DEV__,

        // Performance monitoring
        tracesSampleRate: 0.2, // 20% of transactions

        // Environment
        environment: __DEV__ ? 'development' : 'production',

        // Ignore certain errors
        beforeSend(event) {
            // Filter out network errors that are expected
            if (event.exception?.values?.[0]?.type === 'NetworkError') {
                return null;
            }
            // Skip in development
            if (__DEV__) {
                return null;
            }
            return event;
        },
    });

    console.log('[SENTRY] Initialized');
}

/**
 * Capture an error with optional context
 */
export function captureError(
    error: Error,
    context?: Record<string, any>
): void {
    if (!isSentryConfigured) {
        console.error('[ERROR]', error.message, context);
        return;
    }

    Sentry.withScope((scope) => {
        if (context) {
            scope.setExtras(context);
        }
        Sentry.captureException(error);
    });
}

/**
 * Capture a message with optional level
 */
export function captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info'
): void {
    if (!isSentryConfigured) {
        console.log(`[${level.toUpperCase()}]`, message);
        return;
    }

    Sentry.captureMessage(message, level);
}

/**
 * Set user context for error reports
 */
export function setUser(userId: string | null): void {
    if (!isSentryConfigured) return;

    if (userId) {
        Sentry.setUser({ id: userId });
    } else {
        Sentry.setUser(null);
    }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
    message: string,
    category: string = 'app',
    data?: Record<string, any>
): void {
    if (!isSentryConfigured) return;

    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
    });
}

/**
 * Start a performance span
 */
export function startSpan(
    name: string,
    op: string,
    callback: () => void
): void {
    if (!isSentryConfigured) {
        callback();
        return;
    }

    Sentry.startSpan({ name, op }, callback);
}

/**
 * Set tag for filtering in Sentry dashboard
 */
export function setTag(key: string, value: string): void {
    if (!isSentryConfigured) return;
    Sentry.setTag(key, value);
}

/**
 * Wrap a component with Sentry error boundary
 */
export const withErrorBoundary = Sentry.wrap;

/**
 * React error boundary component
 */
export const ErrorBoundary = Sentry.ErrorBoundary;
