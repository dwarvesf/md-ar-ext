import { 
  openSettings,
  quickConfigureSettings,
  showSettingsUI,
  exportSettings,
  importSettings
} from '../utils/storage/settingsManager';

/**
 * Command handler for opening settings
 */
export async function handleOpenSettings(): Promise<void> {
  await openSettings();
}

/**
 * Command handler for quick configure settings
 */
export async function handleQuickConfigureSettings(): Promise<void> {
  await quickConfigureSettings();
}

/**
 * Command handler for showing settings UI
 */
export async function handleShowSettingsUI(): Promise<void> {
  await showSettingsUI();
}

/**
 * Command handler for exporting settings
 */
export async function handleExportSettings(): Promise<void> {
  await exportSettings();
}

/**
 * Command handler for importing settings
 */
export async function handleImportSettings(): Promise<void> {
  await importSettings();
} 