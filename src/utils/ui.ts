import * as vscode from 'vscode';
import * as path from 'path';

/**
 * WebView panel types
 */
export enum WebViewType {
  settings = 'md-ar-ext.settingsView',
  statistics = 'md-ar-ext.statisticsView'
}

/**
 * Base class for WebView panels
 */
export abstract class BaseWebView {
  protected panel: vscode.WebviewPanel;
  protected context: vscode.ExtensionContext;
  protected disposables: vscode.Disposable[] = [];

  constructor(
    context: vscode.ExtensionContext,
    viewType: WebViewType,
    title: string,
    options: vscode.WebviewPanelOptions & vscode.WebviewOptions = {}
  ) {
    this.context = context;
    
    const defaultOptions: vscode.WebviewPanelOptions & vscode.WebviewOptions = {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, 'media'))
      ]
    };
    
    // Create the WebView panel
    this.panel = vscode.window.createWebviewPanel(
      viewType,
      title,
      vscode.ViewColumn.One,
      { ...defaultOptions, ...options }
    );
    
    // Set the WebView content
    this.setContent();
    
    // Handle messages from the WebView
    this.panel.webview.onDidReceiveMessage(
      this.onMessageReceived.bind(this),
      null,
      this.disposables
    );
    
    // Reset when the panel is disposed
    this.panel.onDidDispose(
      () => this.dispose(),
      null,
      this.disposables
    );
  }
  
  /**
   * Set the WebView content
   */
  protected abstract setContent(): void;
  
  /**
   * Handle messages received from the WebView
   * @param message Message received from the WebView
   */
  protected abstract onMessageReceived(message: any): void;
  
  /**
   * Get a nonce to use in the WebView to avoid code injection
   * @returns A random nonce
   */
  protected getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  
  /**
   * Get a URI for a resource in the extension
   * @param relativePath Path relative to the extension root
   * @returns WebView URI for the resource
   */
  protected getResourceUri(relativePath: string): vscode.Uri {
    const diskPath = vscode.Uri.file(
      path.join(this.context.extensionPath, relativePath)
    );
    return this.panel.webview.asWebviewUri(diskPath);
  }
  
  /**
   * Post a message to the WebView
   * @param message Message to post
   */
  protected postMessage(message: any): Thenable<boolean> {
    return this.panel.webview.postMessage(message);
  }
  
  /**
   * Reveal the WebView panel
   * @param viewColumn Column to show the panel in
   */
  public reveal(viewColumn: vscode.ViewColumn = vscode.ViewColumn.One): void {
    this.panel.reveal(viewColumn);
  }
  
  /**
   * Dispose of the WebView and clean up resources
   */
  public dispose(): void {
    // Clean up our resources
    this.panel.dispose();
    
    // Dispose all registered disposables
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

/**
 * Create and show an information message with configurable buttons
 * @param message Message to show
 * @param items Buttons to show
 * @returns Selected button or undefined if dismissed
 */
export async function showInfoMessage(
  message: string,
  ...items: string[]
): Promise<string | undefined> {
  return vscode.window.showInformationMessage(message, ...items);
}

/**
 * Create and show an error message with configurable buttons
 * @param message Message to show
 * @param items Buttons to show
 * @returns Selected button or undefined if dismissed
 */
export async function showErrorMessage(
  message: string,
  ...items: string[]
): Promise<string | undefined> {
  return vscode.window.showErrorMessage(message, ...items);
}

/**
 * Create and show a warning message with configurable buttons
 * @param message Message to show
 * @param items Buttons to show
 * @returns Selected button or undefined if dismissed
 */
export async function showWarningMessage(
  message: string,
  ...items: string[]
): Promise<string | undefined> {
  return vscode.window.showWarningMessage(message, ...items);
}

/**
 * Show an input box with validation
 * @param options Input box options
 * @returns User input or undefined if cancelled
 */
export async function showInputBox(
  options: vscode.InputBoxOptions
): Promise<string | undefined> {
  return vscode.window.showInputBox(options);
}

/**
 * Show a quick pick selection with options
 * @param items Items to pick from
 * @param options Quick pick options
 * @returns Selected item(s) or undefined if cancelled
 */
export async function showQuickPick<T extends vscode.QuickPickItem>(
  items: T[] | Thenable<T[]>,
  options: vscode.QuickPickOptions & { canPickMany: true }
): Promise<T[] | undefined>;
export async function showQuickPick<T extends vscode.QuickPickItem>(
  items: T[] | Thenable<T[]>,
  options: vscode.QuickPickOptions & { canPickMany: false }
): Promise<T | undefined>;
export async function showQuickPick<T extends vscode.QuickPickItem>(
  items: T[] | Thenable<T[]>,
  options: vscode.QuickPickOptions
): Promise<T | T[] | undefined> {
  return vscode.window.showQuickPick<T>(items, options);
}

/**
 * Show a file open dialog
 * @param options Open dialog options
 * @returns Selected URI(s) or undefined if cancelled
 */
export async function showOpenDialog(
  options: vscode.OpenDialogOptions
): Promise<vscode.Uri[] | undefined> {
  return vscode.window.showOpenDialog(options);
}

/**
 * Show a file save dialog
 * @param options Save dialog options
 * @returns Selected URI or undefined if cancelled
 */
export async function showSaveDialog(
  options: vscode.SaveDialogOptions
): Promise<vscode.Uri | undefined> {
  return vscode.window.showSaveDialog(options);
} 