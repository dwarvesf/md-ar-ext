import * as vscode from 'vscode';

/**
 * Executes a task with a progress indicator
 * @param title The title to display in the progress UI
 * @param task The async task to execute
 * @returns Promise resolving to the result of the task
 */
export async function withProgress<T>(
  title: string,
  task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<T>
): Promise<T> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: false
    },
    task
  );
}

/**
 * Executes a task with a cancellable progress indicator
 * @param title The title to display in the progress UI
 * @param task The async task to execute with cancellation support
 * @returns Promise resolving to the result of the task or undefined if cancelled
 */
export async function withCancellableProgress<T>(
  title: string,
  task: (
    progress: vscode.Progress<{ message?: string; increment?: number }>,
    token: vscode.CancellationToken
  ) => Promise<T>
): Promise<T | undefined> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: true
    },
    task
  );
}

/**
 * Creates a multi-step progress handler
 * @param steps Total number of steps
 * @returns An object with methods to update progress
 */
export function createProgressHandler(steps: number) {
  const stepSize = 100 / steps;
  let currentStep = 0;

  return {
    nextStep: (progress: vscode.Progress<{ message?: string; increment?: number }>, message: string) => {
      currentStep++;
      progress.report({ message, increment: stepSize });
    },
    setPercentage: (
      progress: vscode.Progress<{ message?: string; increment?: number }>,
      percentage: number,
      message: string
    ) => {
      const increment = percentage - (currentStep * stepSize);
      if (increment > 0) {
        progress.report({ message, increment });
      } else {
        progress.report({ message });
      }
    }
  };
}

/**
 * Creates a progress handler with time remaining estimation
 * @param totalSize Total size in bytes or other unit
 * @returns Object with methods to update progress with time estimates
 */
export function createTimeEstimateProgressHandler(totalSize: number) {
  let startTime = Date.now();
  let lastUpdate = startTime;
  let processedSize = 0;
  
  // Running average of speed over last few samples
  const speeds: number[] = [];
  const MAX_SPEED_SAMPLES = 5;
  
  return {
    /**
     * Update progress with a new processed chunk
     * @param progress VS Code progress object
     * @param size Size of chunk processed since last update
     * @param message Custom message to display (optional)
     */
    update: (
      progress: vscode.Progress<{ message?: string; increment?: number }>,
      size: number,
      message?: string
    ) => {
      const now = Date.now();
      const elapsed = now - lastUpdate;
      lastUpdate = now;
      
      // Add to processed size
      processedSize += size;
      
      // Calculate percentage
      const percentage = Math.min(100, (processedSize / totalSize) * 100);
      const increment = percentage - (processedSize - size) / totalSize * 100;
      
      // Calculate speed in bytes per second
      if (elapsed > 0) {
        const speed = size / (elapsed / 1000);
        speeds.push(speed);
        if (speeds.length > MAX_SPEED_SAMPLES) {
          speeds.shift();
        }
      }
      
      // Calculate average speed
      const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
      
      // Estimate time remaining
      const remainingSize = totalSize - processedSize;
      const timeRemaining = avgSpeed > 0 ? remainingSize / avgSpeed : 0;
      
      // Format time remaining
      let timeMessage = '';
      if (timeRemaining > 0 && percentage < 100) {
        if (timeRemaining < 60) {
          timeMessage = `${Math.ceil(timeRemaining)}s remaining`;
        } else {
          timeMessage = `${Math.ceil(timeRemaining / 60)}m ${Math.ceil(timeRemaining % 60)}s remaining`;
        }
      }
      
      // Report progress
      const displayMessage = message 
        ? `${message} (${timeMessage})`
        : `${Math.round(percentage)}% complete (${timeMessage})`;
        
      progress.report({ message: displayMessage, increment });
    },
    
    /**
     * Complete the progress
     * @param progress VS Code progress object
     * @param message Completion message
     */
    complete: (progress: vscode.Progress<{ message?: string; increment?: number }>, message: string) => {
      const totalTime = (Date.now() - startTime) / 1000;
      progress.report({ 
        message: `${message} (Completed in ${totalTime.toFixed(1)}s)`,
        increment: 100 - (processedSize / totalSize * 100)
      });
    }
  };
} 