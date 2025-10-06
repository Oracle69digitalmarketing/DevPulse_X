// src/activityTracker.ts

import * as vscode from 'vscode';

/**
 * Defines the structure for a single metric event.
 * Using a specific type is much safer than 'any'.
 */
export interface IMetricEvent {
  eventName: string;
  properties: {
    [key: string]: any;
  };
  timestamp: number;
}

/**
 * An ActivityTracker class is a more scalable pattern than a simple function.
 * It can manage its own state and listeners.
 */
export class ActivityTracker {
  private metricEmitter: vscode.EventEmitter<IMetricEvent>;

  constructor(emitter: vscode.EventEmitter<IMetricEvent>) {
    this.metricEmitter = emitter;
  }

  /**
   * Initializes listeners for tracking user activity in VS Code.
   * This is where you would hook into the VS Code API.
   * 
   * @param context The extension context for managing subscriptions.
   */
  public initialize(context: vscode.ExtensionContext) {
    // Example: Track when a document is saved
    const disposable = vscode.workspace.onDidSaveTextDocument(document => {
      this.trackEvent('documentSaved', {
        languageId: document.languageId,
        lineCount: document.lineCount,
      });
    });

    context.subscriptions.push(disposable);
  }

  /**
   * Fires a structured metric event.
   * @param eventName A descriptive name for the event.
   * @param properties A key-value map of event details.
   */
  public trackEvent(eventName: string, properties: { [key: string]: any; }) {
    const newMetric: IMetricEvent = {
      eventName,
      properties,
      timestamp: Date.now(),
    };
    this.metricEmitter.fire(newMetric);
    console.log(`Tracked Event: ${eventName}`, properties); // For debugging
  }
}
