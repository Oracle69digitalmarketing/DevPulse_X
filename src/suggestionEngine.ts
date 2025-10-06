// src/suggestionEngine.ts

import * as vscode from 'vscode';
import { parse, ParserPlugin } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import {
  File,
  isIdentifier,
  isMemberExpression,
  isOptionalMemberExpression,
  isOptionalCallExpression,
} from '@babel/types';
import { checkFeature } from './baselineEngine';

// --- Data Layer: Feature Definitions ---
interface IFeatureFix {
  suggestion: string;
  polyfill?: string;
}

const FIX_MAPPINGS: Record<string, IFeatureFix> = {
  fetch: {
    suggestion: 'Consider using a library like axios for universal support or polyfill fetch for Node.js environments.',
    polyfill: `import 'whatwg-fetch';`,
  },
  'Array.prototype.flat': {
    suggestion: 'Use Array.prototype.flatMap or polyfill Array.prototype.flat.',
    polyfill: `import 'core-js/features/array/flat';`,
  },
  'Promise.allSettled': {
    suggestion: 'Polyfill Promise.allSettled for older environments.',
    polyfill: `import 'core-js/features/promise/all-settled';`,
  },
  OptionalChaining: {
    suggestion: 'Optional Chaining (`?.`) may not be supported in older environments. Ensure your build process (e.g., Babel) transpiles it.',
  },
};

// --- Data Structure for Discovered Issues ---
interface IUnsupportedFeature {
  featureName: string;
  fix: IFeatureFix;
  range: vscode.Range;
}

// A cache to store AST results per document version, improving performance.
const astCache = new Map<string, File>();

/**
 * Scans a document for unsupported features using a single AST traversal.
 * This is the core analysis engine.
 */
function findUnsupportedFeatures(document: vscode.TextDocument): IUnsupportedFeature[] {
  const features: IUnsupportedFeature[] = [];
  const code = document.getText();
  const cacheKey = `${document.uri.toString()}|${document.version}`;

  let ast: File | undefined = astCache.get(cacheKey);

  if (!ast) {
    try {
      const plugins: ParserPlugin[] = ['jsx', 'typescript'];
      ast = parse(code, { sourceType: 'module', plugins, errorRecovery: true });
      astCache.set(cacheKey, ast);
    } catch (err) {
      console.error('AST parsing failed:', err);
      astCache.delete(cacheKey); // Don't cache a failed parse
      return [];
    }
  }

  // Use a Set to efficiently track features already found in this traversal.
  const foundInThisRun = new Set<string>();

  traverse(ast, {
    // Check for global identifiers like 'fetch'
    Identifier(path) {
      const featureName = path.node.name;
      if (FIX_MAPPINGS[featureName] && !path.scope.hasBinding(featureName)) {
        addFeatureIfUnsupported(featureName, path, features, foundInThisRun);
      }
    },

    // Check for methods on objects, e.g., `myArray.flat()`
    MemberExpression(path) {
      const property = path.get('property');
      if (isIdentifier(property)) {
        const featureName = `Array.prototype.${property.node.name}`;
        if (FIX_MAPPINGS[featureName]) {
          addFeatureIfUnsupported(featureName, path, features, foundInThisRun);
        }
      }
    },

    // Check for language syntax like Optional Chaining (`?.`)
    OptionalMemberExpression(path) {
      addFeatureIfUnsupported('OptionalChaining', path, features, foundInThisRun);
    },
    OptionalCallExpression(path) {
      addFeatureIfUnsupported('OptionalChaining', path, features, foundInThisRun);
    },
  });

  return features;
}

/**
 * Helper to check feature support and add it to the list if unsupported.
 */
function addFeatureIfUnsupported(
  featureName: string,
  path: NodePath<any>,
  features: IUnsupportedFeature[],
  foundInThisRun: Set<string>
) {
  // Prevent duplicate reporting for the same feature name in a single run.
  if (foundInThisRun.has(featureName)) {
    return;
  }

  const support = checkFeature(featureName);
  if (!support.fullySupported && path.node.loc) {
    const loc = path.node.loc;
    const start = new vscode.Position(loc.start.line - 1, loc.start.column);
    const end = new vscode.Position(loc.end.line - 1, loc.end.column);
    const range = new vscode.Range(start, end);

    features.push({
      featureName,
      fix: FIX_MAPPINGS[featureName],
      range,
    });
    foundInThisRun.add(featureName);
  }
}

/**
 * Quick Fix Provider that injects polyfills when possible.
 */
export class DevPulseQuickFixProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.CodeAction[] {
    const allActions: vscode.CodeAction[] = [];
    const unsupportedFeatures = findUnsupportedFeatures(document);

    for (const feature of unsupportedFeatures) {
      // Only provide a fix if the user's cursor is on the line with the issue.
      if (feature.range.intersection(range)) {
        const { suggestion, polyfill } = feature.fix;

        // Action 1: Provide an informational suggestion.
        const infoAction = new vscode.CodeAction(
          `DevPulse X: ${suggestion}`,
          vscode.CodeActionKind.QuickFix
        );
        allActions.push(infoAction);

        // Action 2: Provide a polyfill injection, if available.
        if (polyfill) {
          const polyfillAction = new vscode.CodeAction(
            `DevPulse X: Inject polyfill for ${feature.featureName}`,
            vscode.CodeActionKind.QuickFix
          );
          polyfillAction.edit = new vscode.WorkspaceEdit();
          polyfillAction.edit.insert(document.uri, new vscode.Position(0, 0), `${polyfill}\n`);
          polyfillAction.isPreferred = true; // Make this the default action.
          allActions.push(polyfillAction);
        }
      }
    }

    return allActions;
  }
}

/**
 * Register Quick Fix provider for relevant languages.
 */
export function registerQuickFixProvider(context: vscode.ExtensionContext) {
  const languages = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];
  
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(languages, new DevPulseQuickFixProvider(), {
      providedCodeActionKinds: DevPulseQuickFixProvider.providedCodeActionKinds,
    })
  );
}
