// src/test/suite/extension.test.ts

import * as assert from 'assert';
import * as vscode from 'vscode';
// import * as myExtension from '../../extension'; // If you export functions from extension.ts

suite('Extension Test Suite', () => {
  // This test will always pass, it's a good sanity check
  test('Sample test', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  // This test checks if your command is registered in package.json and available
  test('Should register the "Show Dashboard" command', async () => {
    // The getCommands function returns an array of all registered command IDs.
    const allCommands = await vscode.commands.getCommands(true);

    // Check if our command is in the list of all available commands
    const dashboardCommand = allCommands.find(c => c === 'devpulse.showDashboard');

    assert.ok(dashboardCommand, '"devpulse.showDashboard" command is not registered!');
  });
});
