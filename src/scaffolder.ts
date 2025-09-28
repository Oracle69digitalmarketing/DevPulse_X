import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function autoScaffold(componentName: string) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return;
    }

    const folderPath = path.join(workspaceFolders[0].uri.fsPath, componentName);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

    // Basic React component template
    const componentCode = `import React from 'react';

export const ${componentName}: React.FC = () => {
    return <div>${componentName} Component</div>;
};
`;

    fs.writeFileSync(path.join(folderPath, `${componentName}.tsx`), componentCode);
}
