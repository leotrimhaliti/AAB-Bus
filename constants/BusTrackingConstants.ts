/**
 * Map Configuration Constants
 */
export const MAP_CONFIG = {
    INITIAL_REGION: {
        latitude: 42.638,
        longitude: 21.114,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    },
    ZOOM_LEVEL: {
        FOLLOWING: 16,
        DEFAULT: 14,
    },
    EDGE_PADDING: {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
    },
} as const;

/**
 * Bus Tracking Constants
 */
export const BUS_TRACKING = {
    POLL_INTERVAL_MS: 10000, // 10 seconds
    CAMERA_ANIMATION_DURATION_MS: 2000, // 2 seconds
    IMAGE_LOAD_DELAY_MS: 500,
    PULSE_ANIMATION_DURATION_MS: 800,
} as const;

/**
 * Distance Thresholds (in meters)
 */
export const DISTANCE_THRESHOLDS = {
    STOP_PROXIMITY: 200, // Distance to consider bus at a stop
    STOP_EXACT_MATCH: 100, // Distance for exact stop match
    LAKRISHTE_TRIGGER: 150, // Distance to trigger return journey at Lakrishte
    KOLEGJI_AAB_PROXIMITY: 200, // Distance for Kolegji AAB detection
    RESTART_THRESHOLD: 300, // Distance to trigger route restart
} as const;

/**
 * Route Stop Indices
 */
export const ROUTE_STOPS = {
    LAKRISHTE_INDEX: 5, // Index of Lakrishte stop (triggers return journey)
    START_INDEX: 0,
} as const;

/**
 * Marker Configuration
 */
export const MARKER_CONFIG = {
    BUS_SIZE: 40,
    BUS_WRAPPER_SIZE: 44,
    SELECTED_SCALE: 1.1,
    PULSE_SCALE_MAX: 1.2,
    PULSE_SCALE_MIN: 1,
    Z_INDEX: {
        STOP: 1,
        BUS: 2,
    },
} as const;

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
    STOP_CIRCLE_SIZE: 12,
    STOP_CIRCLE_CURRENT_SIZE: 16,
    STOP_LINE_HEIGHT: 40,
    STOP_LINE_WIDTH: 2,
} as const;
