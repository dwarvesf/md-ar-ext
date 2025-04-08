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
      label: 'WebP Quality',
      description: `Current: ${getWebpQuality()}`,
      detail: 'Set the quality level for WebP conversion (50-100)',
      id: 'webpQuality'
    },
    {
      label: 'Maximum Image Width',
      description: `Current: ${getMaxDimensions().width}px`,
      detail: 'Set the maximum width before resizing images',
      id: 'maxWidth'
    },
    {
      label: 'Maximum Image Height',
      description: `Current: ${getMaxDimensions().height}px`,
      detail: 'Set the maximum height before resizing images',
      id: 'maxHeight'
    },
    {
      label: 'Enable Metadata Tags',
      description: `Current: ${getMetadataTagsEnabled() ? 'Enabled' : 'Disabled'}`,
      detail: 'Add additional metadata tags to Arweave uploads',
      id: 'enableMetadataTags'
    },
    {
      label: 'Show Upload Progress',
      description: `Current: ${getSetting('showUploadProgress', DEFAULT_SETTINGS.showUploadProgress) ? 'Enabled' : 'Disabled'}`,
      detail: 'Show detailed progress information during uploads',
      id: 'showUploadProgress'
    },
    {
      label: 'Check Balance Before Upload',
      description: `Current: ${getSetting('checkBalanceBeforeUpload', DEFAULT_SETTINGS.checkBalanceBeforeUpload) ? 'Enabled' : 'Disabled'}`,
      detail: 'Check if wallet has sufficient balance before uploading',
      id: 'checkBalanceBeforeUpload'
    },
    {
      label: 'Manage Custom Tags',
      description: `${getCustomTags().length} tags configured`,
      detail: 'Add or remove custom tags for Arweave uploads',
      id: 'customTags'
    },
    {
      label: 'Open Settings in Editor',
      description: 'Edit all settings in settings.json',
      detail: 'Use the VS Code settings editor to modify all extension settings',
      id: 'openSettingsJson'
    }
  ];

  const selection = await vscode.window.showQuickPick(settings, {
    title: 'md-ar-ext Settings',
    placeHolder: 'Select a setting to configure'
  });

  if (!selection) {
    return;
  }

  switch (selection.id) {
    case 'webpQuality':
      await showNumericQuickPick(
        'webpQuality', 
        ['50', '60', '70', '80', '90', '95', '100'],
        'WebP Quality',
        'Select quality level (higher = better quality but larger files)'
      );
      break;
    
    case 'maxWidth':
      await showDimensionInput(
        'maxWidth',
        'Maximum Image Width',
        getMaxDimensions().width
      );
      break;
    
    case 'maxHeight':
      await showDimensionInput(
        'maxHeight',
        'Maximum Image Height',
        getMaxDimensions().height
      );
      break;
    
    case 'enableMetadataTags':
      const enableMetadata = await vscode.window.showQuickPick(
        ['Enable', 'Disable'],
        {
          title: 'Metadata Tagging',
          placeHolder: 'Add metadata tags to Arweave uploads?'
        }
      );
      
      if (enableMetadata) {
        await updateSetting('enableMetadataTags', enableMetadata === 'Enable');
      }
      break;
    
    case 'showUploadProgress':
      const showProgress = await vscode.window.showQuickPick(
        ['Enable', 'Disable'],
        {
          title: 'Upload Progress',
          placeHolder: 'Show detailed progress during uploads?'
        }
      );
      
      if (showProgress) {
        await updateSetting('showUploadProgress', showProgress === 'Enable');
      }
      break;
    
    case 'checkBalanceBeforeUpload':
      const checkBalance = await vscode.window.showQuickPick(
        ['Enable', 'Disable'],
        {
          title: 'Balance Check',
          placeHolder: 'Check wallet balance before uploading?'
        }
      );
      
      if (checkBalance) {
        await updateSetting('checkBalanceBeforeUpload', checkBalance === 'Enable');
      }
      break;
    
    case 'customTags':
      await manageCustomTags();
      break;
    
    case 'openSettingsJson':
      await openSettings();
      break;
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