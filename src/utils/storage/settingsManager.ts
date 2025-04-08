import * as vscode from 'vscode';

const CONFIG_SECTION = 'md-ar-ext';

/**
 * Interface defining all extension settings
 */
export interface ExtensionSettings {
  webpQuality: number;
  maxDimension: { width: number; height: number };
  tagMetadata: boolean;
  showUploadProgress: boolean;
  checkBalanceBeforeUpload: boolean;
  customTags: Array<{ name: string; value: string }>;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  webpQuality: 90,
  maxDimension: { width: 1876, height: 1251 },
  tagMetadata: false,
  showUploadProgress: true,
  checkBalanceBeforeUpload: true,
  customTags: []
};

/**
 * Gets WebP quality setting
 * @returns WebP quality value (50-100)
 */
export function getWebpQuality(): number {
  return vscode.workspace.getConfiguration(CONFIG_SECTION).get('webpQuality', DEFAULT_SETTINGS.webpQuality);
}

/**
 * Gets maximum dimensions for resizing
 * @returns Object containing max width and height
 */
export function getMaxDimensions(): { width: number; height: number } {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  return {
    width: config.get('maxWidth', DEFAULT_SETTINGS.maxDimension.width),
    height: config.get('maxHeight', DEFAULT_SETTINGS.maxDimension.height)
  };
}

/**
 * Checks if metadata tagging is enabled
 * @returns Boolean indicating if metadata tags should be added
 */
export function getMetadataTagsEnabled(): boolean {
  return vscode.workspace.getConfiguration(CONFIG_SECTION).get('enableMetadataTags', DEFAULT_SETTINGS.tagMetadata);
}

/**
 * Gets custom tags for Arweave uploads
 * @returns Array of custom tags in format { name: string, value: string }
 */
export function getCustomTags(): Array<{ name: string; value: string }> {
  const rawTags = vscode.workspace.getConfiguration(CONFIG_SECTION).get('customTags', []) as string[];
  return rawTags.map(tag => {
    const [name, value] = tag.split(':').map(part => part.trim());
    return { name, value };
  }).filter(tag => tag.name && tag.value);
}

/**
 * Gets the current value for any setting
 * @param key Setting key
 * @param defaultValue Default value if setting is not found
 * @returns Setting value of type T
 */
export function getSetting<T>(key: string, defaultValue: T): T {
  return vscode.workspace.getConfiguration(CONFIG_SECTION).get(key, defaultValue);
}

/**
 * Updates a setting value
 * @param key Setting key
 * @param value New value
 * @param target Configuration target (user or workspace)
 */
export async function updateSetting(
  key: string, 
  value: any, 
  target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
): Promise<void> {
  await vscode.workspace.getConfiguration(CONFIG_SECTION).update(key, value, target);
}

/**
 * Opens the settings UI focused on the extension's settings
 */
export async function openSettings(): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.openSettings', `@ext:${CONFIG_SECTION}`);
}

/**
 * Show a quick pick list of options for a numeric setting
 * @param key Setting key
 * @param options Array of options to show
 * @param title Title for the quick pick
 * @param placeholder Placeholder text
 */
async function showNumericQuickPick(
  key: string,
  options: string[],
  title: string,
  placeholder: string
): Promise<void> {
  const selection = await vscode.window.showQuickPick(
    options,
    {
      title,
      placeHolder: placeholder,
      canPickMany: false
    }
  );

  if (selection) {
    await updateSetting(key, parseInt(selection));
  }
}

/**
 * Show input box for custom dimensions
 * @param key Setting key (width or height)
 * @param title Input box title
 * @param currentValue Current value of the setting
 */
async function showDimensionInput(key: string, title: string, currentValue: number): Promise<void> {
  const input = await vscode.window.showInputBox({
    title,
    value: currentValue.toString(),
    validateInput: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num <= 0) {
        return 'Please enter a positive number';
      }
      return null;
    }
  });

  if (input) {
    await updateSetting(key, parseInt(input));
  }
}

/**
 * Add a custom tag
 */
async function addCustomTag(): Promise<void> {
  const name = await vscode.window.showInputBox({
    title: 'Tag Name',
    prompt: 'Enter the name for this tag',
    validateInput: (value) => {
      if (!value || value.trim() === '') {
        return 'Tag name cannot be empty';
      }
      if (value.includes(':')) {
        return 'Tag name cannot contain colon (:)';
      }
      return null;
    }
  });

  if (!name) {
    return;
  }

  const value = await vscode.window.showInputBox({
    title: 'Tag Value',
    prompt: 'Enter the value for this tag',
    validateInput: (val) => {
      if (!val || val.trim() === '') {
        return 'Tag value cannot be empty';
      }
      if (val.includes(':')) {
        return 'Tag value cannot contain colon (:)';
      }
      return null;
    }
  });

  if (!value) {
    return;
  }

  const tag = `${name}:${value}`;
  const currentTags = vscode.workspace.getConfiguration(CONFIG_SECTION).get('customTags', []) as string[];
  
  await updateSetting('customTags', [...currentTags, tag]);
  vscode.window.showInformationMessage(`Added tag: ${tag}`);
}

/**
 * Show and manage custom tags
 */
async function manageCustomTags(): Promise<void> {
  const currentTags = vscode.workspace.getConfiguration(CONFIG_SECTION).get('customTags', []) as string[];
  
  if (currentTags.length === 0) {
    const result = await vscode.window.showInformationMessage(
      'No custom tags configured',
      'Add Tag',
      'Cancel'
    );
    
    if (result === 'Add Tag') {
      await addCustomTag();
    }
    return;
  }
  
  const tagItems = currentTags.map(tag => ({
    label: tag,
    description: 'Click to delete'
  }));
  
  tagItems.push({
    label: '+ Add New Tag',
    description: 'Create a new custom tag'
  });
  
  const selection = await vscode.window.showQuickPick(tagItems, {
    title: 'Manage Custom Tags',
    placeHolder: 'Select a tag to delete or add a new one'
  });
  
  if (!selection) {
    return;
  }
  
  if (selection.label === '+ Add New Tag') {
    await addCustomTag();
  } else {
    // Remove the selected tag
    const updatedTags = currentTags.filter(tag => tag !== selection.label);
    await updateSetting('customTags', updatedTags);
    vscode.window.showInformationMessage(`Removed tag: ${selection.label}`);
  }
}

/**
 * Displays a comprehensive settings UI
 */
export async function showSettingsUI(): Promise<void> {
  const settings = [
    {
      label: '⚙️ WebP Quality',
      description: `Current: ${getWebpQuality()}`,
      detail: 'Configure quality level for WebP conversion (higher = better quality but larger file)'
    },
    {
      label: '📐 Max Dimensions',
      description: `Current: ${getMaxDimensions().width}×${getMaxDimensions().height}`,
      detail: 'Set maximum dimensions for image resizing'
    },
    {
      label: '🏷️ Metadata Tags',
      description: `Current: ${getMetadataTagsEnabled() ? 'Enabled' : 'Disabled'}`,
      detail: 'Enable or disable adding metadata tags to uploads'
    },
    {
      label: '🏷️ Custom Tags',
      description: 'Configure custom tags for uploads',
      detail: 'Add or remove custom tags for Arweave uploads'
    },
    {
      label: '📤 Export Settings',
      description: 'Save current settings to a file',
      detail: 'Export all extension settings to a JSON file'
    },
    {
      label: '📥 Import Settings',
      description: 'Load settings from a file',
      detail: 'Import extension settings from a JSON file'
    }
  ];
  
  const selection = await vscode.window.showQuickPick(settings, {
    placeHolder: 'Select a setting to configure'
  });
  
  if (!selection) {
    return;
  }
  
  if (selection.label.includes('WebP Quality')) {
    const options = ['70', '80', '90', '95', '100'];
    await showNumericQuickPick(
      'webpQuality',
      options,
      'Select WebP Quality',
      `Current: ${getWebpQuality()}`
    );
  } 
  else if (selection.label.includes('Max Dimensions')) {
    const dimensionOptions = [
      { label: 'Width', key: 'maxWidth', currentValue: getMaxDimensions().width },
      { label: 'Height', key: 'maxHeight', currentValue: getMaxDimensions().height }
    ];
    
    const dimensionSelection = await vscode.window.showQuickPick(
      dimensionOptions.map(opt => ({
        label: opt.label,
        description: `Current: ${opt.currentValue}px`
      })),
      { title: 'Select dimension to change' }
    );
    
    if (dimensionSelection) {
      const option = dimensionOptions.find(opt => opt.label === dimensionSelection.label);
      if (option) {
        await showDimensionInput(option.key, `Set maximum ${option.label.toLowerCase()}`, option.currentValue);
      }
    }
  } 
  else if (selection.label.includes('Metadata Tags')) {
    const enabled = getMetadataTagsEnabled();
    const newValue = !enabled;
    
    await updateSetting('enableMetadataTags', newValue);
    vscode.window.showInformationMessage(`Metadata tags ${newValue ? 'enabled' : 'disabled'}`);
  } 
  else if (selection.label.includes('Custom Tags')) {
    await manageCustomTags();
  }
  else if (selection.label.includes('Export Settings')) {
    await exportSettings();
  }
  else if (selection.label.includes('Import Settings')) {
    await importSettings();
  }
}

/**
 * Displays a quick configuration UI for common settings
 */
export async function quickConfigureSettings(): Promise<void> {
  const quality = await vscode.window.showQuickPick(
    ['70', '80', '90', '95', '100'],
    {
      placeHolder: 'WebP Quality',
      canPickMany: false
    }
  );

  if (quality) {
    await updateSetting('webpQuality', parseInt(quality));
  }

  const enableMetadata = await vscode.window.showQuickPick(
    ['Yes', 'No'],
    {
      placeHolder: 'Enable metadata tagging?',
      canPickMany: false
    }
  );

  if (enableMetadata) {
    await updateSetting('enableMetadataTags', enableMetadata === 'Yes');
  }
  
  const showProgress = await vscode.window.showQuickPick(
    ['Yes', 'No'],
    {
      placeHolder: 'Show detailed upload progress?',
      canPickMany: false
    }
  );

  if (showProgress) {
    await updateSetting('showUploadProgress', showProgress === 'Yes');
  }

  const checkBalance = await vscode.window.showQuickPick(
    ['Yes', 'No'],
    {
      placeHolder: 'Check wallet balance before uploads?',
      canPickMany: false
    }
  );

  if (checkBalance) {
    await updateSetting('checkBalanceBeforeUpload', checkBalance === 'Yes');
  }

  vscode.window.showInformationMessage('Settings updated successfully.');
}

/**
 * Exports all extension settings to a JSON file
 */
export async function exportSettings(): Promise<void> {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  
  // Get all settings
  const settings: Record<string, any> = {};
  const allSettings = DEFAULT_SETTINGS as Record<string, any>;
  
  // Iterate through all default settings to get their current values
  for (const key in allSettings) {
    settings[key] = config.get(key, allSettings[key]);
  }
  
  // Let user select where to save the file
  const defaultFilename = 'md-ar-ext-settings.json';
  let defaultUri: vscode.Uri;
  
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    defaultUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, defaultFilename);
  } else {
    defaultUri = vscode.Uri.file(defaultFilename);
  }
  
  const fileUri = await vscode.window.showSaveDialog({
    defaultUri,
    filters: { 'JSON Files': ['json'] },
    title: 'Export Extension Settings'
  });
  
  if (fileUri) {
    try {
      // Format JSON nicely with 2 spaces indentation
      const content = JSON.stringify(settings, null, 2);
      
      // Use VS Code file system API to write file
      await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf-8'));
      
      vscode.window.showInformationMessage(`Settings exported to ${fileUri.fsPath}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to export settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Imports extension settings from a JSON file
 */
export async function importSettings(): Promise<void> {
  // Let user select the file to import
  const fileUris = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    filters: { 'JSON Files': ['json'] },
    title: 'Import Extension Settings'
  });
  
  if (!fileUris || fileUris.length === 0) {
    return;
  }
  
  try {
    // Read the file content
    const content = await vscode.workspace.fs.readFile(fileUris[0]);
    const settingsJson = Buffer.from(content).toString('utf-8');
    
    // Parse the JSON
    const importedSettings = JSON.parse(settingsJson);
    
    // Validate the settings structure
    if (typeof importedSettings !== 'object' || importedSettings === null) {
      throw new Error('Invalid settings file format');
    }
    
    // Apply all settings
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    
    for (const [key, value] of Object.entries(importedSettings)) {
      await config.update(key, value, vscode.ConfigurationTarget.Global);
    }
    
    vscode.window.showInformationMessage('Settings imported successfully');
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to import settings: ${error instanceof Error ? error.message : String(error)}`);
  }
} 