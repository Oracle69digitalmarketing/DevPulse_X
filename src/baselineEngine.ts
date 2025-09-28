import { features } from 'web-features';

export function checkFeature(featureName: string) {
    const info = features[featureName];
    if (!info) return { fullySupported: false, browsers: [] };
    const fullySupported = Object.values(info.supportedBrowsers).every(v => v === true);
    return { fullySupported, browsers: Object.keys(info.supportedBrowsers).filter(k => !info.supportedBrowsers[k]) };
}
