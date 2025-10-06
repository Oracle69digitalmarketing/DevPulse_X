/**
 * Defines the structure for messages passed between the VS Code extension
 * and the webview panel.
 */
export type DashboardMessage = {
  /**
   * A string identifier for the command being sent.
   * The receiver uses this to determine how to handle the message.
   */
  command: string;

  /**
   * An optional data payload associated with the command.
   * The type is `any` for flexibility, but can be narrowed down
   * to more specific types for better type safety if needed.
   */
  payload?: any;
};
{
  "compilerOptions": {
    // --- Core Build Settings for a VS Code Extension ---
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "outDir": "./out",
    "rootDir": "./src",
    "sourceMap": true,

    // --- Module Resolution ---
    "moduleResolution": "node",
    "resolveJsonModule": true,

    // --- Interoperability & JSX ---
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "jsx": "react-jsx",

    // --- Strictness & Code Quality ---
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true // Speeds up compilation by not checking dependency types.
  },
  "include": ["src"],
  "exclude": ["node_modules", ".vscode-test", "out", "dist"]
}
