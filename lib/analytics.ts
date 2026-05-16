// Lightweight, defensive wrapper around Firebase Analytics so the app still runs
// even if the native Firebase module is not installed (e.g., Expo Go / dev builds).
let analyticsInstance: any = null;

try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const analytics = require('@react-native-firebase/analytics').default;
    analyticsInstance = analytics();
} catch (error) {
    if (__DEV__) {
        console.warn('[Analytics] Firebase module unavailable; analytics disabled.', error);
    }
}

const run = async (fn: (analytics: any) => Promise<void>) => {
    if (!analyticsInstance) return;
    try {
        await fn(analyticsInstance);
    } catch (error) {
        if (__DEV__) {
            console.warn('[Analytics] Failed to run analytics call', error);
        }
    }
};

/**
 * Firebase Analytics helper functions
 * Use these throughout your app to track user behavior
 */

/**
 * Log a custom event
 * @param eventName - Name of the event (use snake_case)
 * @param params - Optional parameters for the event
 *
 * @example
 * await logEvent('button_click', { button_name: 'book_bus', screen: 'home' });
 * await logEvent('search_performed', { query: 'Prishtina' });
 */
export const logEvent = async (
    eventName: string,
    params?: Record<string, string | number | boolean>
): Promise<void> => {
    await run((a) => a.logEvent(eventName, params));
};

/**
 * Log a screen view
 * @param screenName - Name of the screen
 * @param screenClass - Optional class name of the screen
 *
 * @example
 * await logScreenView('HomeScreen');
 * await logScreenView('BusDetails', 'BusDetailsScreen');
 */
export const logScreenView = async (
    screenName: string,
    screenClass?: string
): Promise<void> => {
    await run((a) => a.logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
    }));
};

/**
 * Log when a user selects content
 * @param contentType - Type of content (e.g., 'bus', 'route', 'schedule')
 * @param itemId - Unique identifier for the content
 *
 * @example
 * await logSelectContent('bus', 'bus_123');
 * await logSelectContent('route', 'prishtina_to_prizren');
 */
export const logSelectContent = async (
    contentType: string,
    itemId: string
): Promise<void> => {
    await run((a) => a.logSelectContent({
        content_type: contentType,
        item_id: itemId,
    }));
};

/**
 * Log a search event
 * @param searchTerm - The search query
 *
 * @example
 * await logSearch('Prishtina');
 */
export const logSearch = async (searchTerm: string): Promise<void> => {
    await run((a) => a.logSearch({ search_term: searchTerm }));
};

/**
 * Log user login
 * @param method - Login method (e.g., 'email', 'google', 'apple')
 *
 * @example
 * await logLogin('email');
 */
export const logLogin = async (method: string): Promise<void> => {
    await run((a) => a.logLogin({ method }));
};

/**
 * Log user sign up
 * @param method - Sign up method (e.g., 'email', 'google', 'apple')
 *
 * @example
 * await logSignUp('email');
 */
export const logSignUp = async (method: string): Promise<void> => {
    await run((a) => a.logSignUp({ method }));
};

/**
 * Set user ID for analytics (useful for tracking across sessions)
 * @param userId - Unique user identifier
 *
 * @example
 * await setUserId('user_12345');
 */
export const setUserId = async (userId: string | null): Promise<void> => {
    await run((a) => a.setUserId(userId));
};

/**
 * Set a user property
 * @param name - Property name
 * @param value - Property value
 *
 * @example
 * await setUserProperty('preferred_language', 'sq');
 * await setUserProperty('subscription_type', 'premium');
 */
export const setUserProperty = async (
    name: string,
    value: string | null
): Promise<void> => {
    await run((a) => a.setUserProperty(name, value));
};
