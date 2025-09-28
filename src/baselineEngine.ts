import { features } from 'web-features';

/**
 * Checks if a feature is fully supported across major browsers.
 * Returns support details for tooltip and suggestions.
 */
export function checkFeature(featureName: string) {
    const support = features[featureName];
    if (!support) {
        return {
            fullySupported: false,
            message: 'Feature not found in Baseline data.',
            unsupportedBrowsers: [],
        };
    }

    // Determine unsupported browsers
    const unsupportedBrowsers = Object.entries(support)
        .filter(([_, v]) => v !== true)
        .map(([browser]) => browser);

    const fullySupported = unsupportedBrowsers.length === 0;

    return { fullySupported, support, unsupportedBrowsers };
}
