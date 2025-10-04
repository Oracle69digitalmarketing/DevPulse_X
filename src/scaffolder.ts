import * as vscode from 'vscode';
import * as path from 'path';

/**
 * A helper function to ensure a string is in PascalCase.
 * e.g., "my component" -> "MyComponent", "my-component" -> "MyComponent"
 */
function toPascalCase(str: string): string {
    return str
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove invalid characters
        .split(/[\s-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

/**
 * Asynchronously scaffolds a new React component directory and files.
 * Uses VS Code's workspace API for file operations to ensure non-blocking behavior
 * and compatibility with remote development environments.
 */
export async function autoScaffold(componentNameInput: string) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder is open. Please open a project to use this feature.');
        return;
    }

    // 1. Sanitize the input to create a valid component name
    const componentName = toPascalCase(componentNameInput);
    if (!componentName) {
        vscode.window.showErrorMessage('Invalid component name provided.');
        return;
    }

    const rootUri = workspaceFolders[0].uri;
    const componentFolderUri = vscode.Uri.joinPath(rootUri, componentName);
    const componentFileUri = vscode.Uri.joinPath(componentFolderUri, `${componentName}.tsx`);

    try {
        // 2. Check if the component file already exists to prevent overwriting
        try {
            await vscode.workspace.fs.stat(componentFileUri);
            const answer = await vscode.window.showWarningMessage(
                `Component '${componentName}' already exists. Do you want to overwrite it?`,
                { modal: true },
                'Overwrite'
            );

            if (answer !== 'Overwrite') {
                vscode.window.showInformationMessage('Scaffolding cancelled.');
                return;
            }
        } catch {
            // File does not exist, which is the normal case. Proceed.
        }

        // 3. Create the directory and file using asynchronous APIs
        await vscode.workspace.fs.createDirectory(componentFolderUri);

        const componentTemplate = `import React from 'react';

interface ${componentName}Props {
  // Define your component's props here
}

export const ${componentName}: React.FC<${componentName}Props> = ({}) => {
    return (
        <div>
            <h1>${componentName} Component</h1>
        </div>
    );
};
`;
        // Convert string to Uint8Array for writing
        const writeData = new TextEncoder().encode(componentTemplate);
        await vscode.workspace.fs.writeFile(componentFileUri, writeData);

        // 4. Provide positive user feedback and open the new file
        vscode.window.showInformationMessage(`Successfully created component: ${componentName}`);
        const document = await vscode.workspace.openTextDocument(componentFileUri);
        await vscode.window.showTextDocument(document);

    } catch (error) {
        // 5. Provide robust error handling
        console.error('Failed to scaffold component:', error);
        vscode.window.showErrorMessage(`Failed to create component. See extension logs for details.`);
    }
}
