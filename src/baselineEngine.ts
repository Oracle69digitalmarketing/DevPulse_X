import { features } from 'web-features';

/**
 * Checks if a feature is supported fully across major browsers.
 */
export function checkFeature(featureName: string) {
    const support = features[featureName];
    if (!support) {
        return { fullySupported: false, message: 'Feature not found in Baseline data.' };
    }

    const fullySupported = Object.values(support).every(v => v === true);
    return { fullySupported, support };
}
