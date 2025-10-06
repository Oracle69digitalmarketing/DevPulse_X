// src/baselineEngine.ts

import { features, Identifier, SupportStatement, BrowserName } from 'web-features';

// --- Type Definitions for Clarity and Safety ---

/**
 * The result of a feature check, providing a consistent and predictable shape.
 */
export interface FeatureSupportResult {
    /** Is the feature part of the MDN Baseline and widely supported? */
    isBaseline: boolean;
    /** A user-friendly message describing the support status. */
    message: string;
    /** The raw support data from the 'web-features' library, if found. */
    supportData: SupportStatement | null;
    /** A list of browsers where the feature is explicitly not supported. */
    unsupportedBrowsers: BrowserName[];
    /** A list of browsers where the feature is only available in a preview/beta version. */
    previewBrowsers: BrowserName[];
}

/**
 * Checks if a web feature is part of the MDN Baseline.
 * Returns a detailed support object for use in tooltips and suggestions.
 *
 * @param featureName The canonical name of the feature to check (e.g., 'css-nesting').
 * @returns A FeatureSupportResult object with detailed compatibility info.
 */
export function checkFeature(featureName: string): FeatureSupportResult {
    // Correctly access the feature data and its nested '__compat' property.
    const featureData: Identifier | undefined = features[featureName];
    const supportData = featureData?.__compat?.support ?? null;

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
    const unsupportedBrowsers: BrowserName[] = [];
    const previewBrowsers: BrowserName[] = [];

    // Iterate over the keys of the support data, which are browser names.
    for (const browser of Object.keys(supportData) as BrowserName[]) {
        const supportValue = supportData[browser];
        // The library can have complex objects, so we only check for simple false/'preview' values.
        if (supportValue === false) {
            unsupportedBrowsers.push(browser);
        } else if (supportValue === 'preview') {
            previewBrowsers.push(browser);
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
