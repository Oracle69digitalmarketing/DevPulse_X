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
