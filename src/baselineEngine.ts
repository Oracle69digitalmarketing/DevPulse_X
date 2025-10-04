import { features, Browser, Feature } from 'web-features';

// --- Type Definitions for Clarity and Safety ---

/**
 * The support data for a specific feature across browsers.
 * This is the type of `features[featureName]`.
 */
type FeatureSupportData = Feature['support'];

/**
 * The result of a feature check, providing a consistent and predictable shape.
 */
export interface FeatureSupportResult {
    /** Is the feature part of the MDN Baseline in all major browsers? */
    isBaseline: boolean;
    /** A user-friendly message describing the support status. */
    message: string;
    /** The raw support data from the 'web-features' library, if found. */
    supportData: FeatureSupportData | null;
    /** A list of browsers where the feature is explicitly not supported. */
    unsupportedBrowsers: Browser[];
    /** A list of browsers where the feature is only available in a preview/beta version. */
    previewBrowsers: Browser[];
}

/**
 * Checks if a web feature is part of the MDN Baseline.
 * Returns a detailed support object for use in tooltips and suggestions.
 *
 * @param featureName The canonical name of the feature to check (e.g., 'css-nesting').
 * @returns A FeatureSupportResult object with detailed compatibility info.
 */
export function checkFeature(featureName: string): FeatureSupportResult {
    const supportData = features[featureName]?.support;

    // Case 1: The feature is not found in the compatibility database.
    if (!supportData) {
        return {
            isBaseline: false,
            message: `Feature '${featureName}' was not found in the MDN Baseline data.`,
            supportData: null,
            unsupportedBrowsers: [],
            previewBrowsers: [],
        };
    }

    // Case 2: The feature was found, so we analyze its support.
    const unsupportedBrowsers: Browser[] = [];
    const previewBrowsers: Browser[] = [];

    for (const browser in supportData) {
        const supportValue = supportData[browser as Browser];
        if (supportValue === false) {
            unsupportedBrowsers.push(browser as Browser);
        } else if (supportValue === 'preview') {
            previewBrowsers.push(browser as Browser);
        }
    }

    const isBaseline = unsupportedBrowsers.length === 0 && previewBrowsers.length === 0;

    // Generate a helpful message based on the findings.
    let message: string;
    if (isBaseline) {
        message = `✅ '${featureName}' is part of the MDN Baseline and is widely supported.`;
    } else if (unsupportedBrowsers.length > 0) {
        message = `⚠️ '${featureName}' is not supported in: ${unsupportedBrowsers.join(', ')}.`;
    } else { // Only preview browsers remain
        message = `👀 '${featureName}' is only available in preview versions of: ${previewBrowsers.join(', ')}.`;
    }

    return {
        isBaseline,
        message,
        supportData,
        unsupportedBrowsers,
        previewBrowsers,
    };
}
