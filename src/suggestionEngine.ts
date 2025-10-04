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
// Using a more structured interface makes this easier to manage.
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
    polyfill: undefined, // Transpilation is the fix, not a polyfill.
  },
};

// --- Data Structure for Discovered Issues ---
// This structure helps pass detailed information between functions.
interface IUnsupportedFeature {
  featureName: string;
  fix: IFeatureFix;
  range: vscode.Range;
}

/**
 * Scans a document for unsupported features using a single AST traversal.
 * This is the core analysis engine.
 */
function findUnsupportedFeatures(document: vscode.TextDocument): IUnsupportedFeature[] {
  const features: IUnsupportedFeature[] = [];
  const code = document.getText();
  const plugins: ParserPlugin[] = ['jsx', 'typescript'];

  let ast: File;
  try {
    ast = parse(code, { sourceType: 'module', plugins });
  } catch (err) {
    console.error('AST parsing failed:', err);
    return []; // Exit gracefully if parsing fails
  }

  traverse(ast, {
    // Check for global identifiers like 'fetch'
    Identifier(path: NodePath) {
      const featureName = path.node.name;
      if (FIX_MAPPINGS[featureName] && path.scope.hasBinding(featureName) === false) {
        addFeatureIfUnsupported(featureName, path, features);
      }
    },

    // Check for methods on objects, e.g., `myArray.flat()`
    MemberExpression(path: NodePath) {
      const property = path.get('property');
      if (isIdentifier(property)) {
        // Construct a more robust key, e.g., 'Array.prototype.flat'
        const featureName = `Array.prototype.${property.node.name}`;
        if (FIX_MAPPINGS[featureName]) {
          addFeatureIfUnsupported(featureName, path, features);
        }
      }
    },

    // Check for language syntax like Optional Chaining (`?.`)
    OptionalMemberExpression(path: NodePath) {
      addFeatureIfUnsupported('OptionalChaining', path, features);
    },
    OptionalCallExpression(path: NodePath) {
      addFeatureIfUnsupported('OptionalChaining', path, features);
    },
  });

  return features;
}

/**
 * Helper to check feature support and add it to the list if unsupported.
 */
function addFeatureIfUnsupported(
  featureName: string,
  path: NodePath,
  features: IUnsupportedFeature[]
) {
  // Prevent duplicate reporting for the same feature
  if (features.some(f => f.featureName === featureName)) {
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
  }
}

/**
 * Quick Fix Provider that injects polyfills when possible.
 * This class now consumes the results of `findUnsupportedFeatures`.
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
        infoAction.isPreferred = false;
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
 * Register Quick Fix provider for both JavaScript and TypeScript.
 */
export function registerQuickFix(context: vscode.ExtensionContext) {
  const languages = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];
  
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(languages, new DevPulseQuickFixProvider(), {
      providedCodeActionKinds: DevPulseQuickFixProvider.providedCodeActionKinds,
    })
  );
}
