import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import type { Executor } from './executor.js';

/**
 * An executor implementation that runs commands in Windows Subsystem for Linux (WSL).
 */
export class WslExecutor implements Executor {
  public readonly execAsync: (command: string) => Promise<{ stdout: string; stderr: string }>;
  public readonly distribution: string;

  /**
   * Create a new WSL executor.
   * @param distribution The name of the WSL distribution to execute commands in (default: "Ubuntu")
   */
  constructor(distribution = 'Ubuntu') {
    this.distribution = distribution;
    this.execAsync = promisify(exec);
  }

  /**
   * Execute a command in Windows Subsystem for Linux.
   * @param command The command to execute
   * @param workingDirectory The working directory where the command should be executed
   * @returns A promise that resolves to an object with stdout and stderr properties
   */
  async execute(
    command: string,
    workingDirectory: string,
  ): Promise<{ stdout: string; stderr: string }> {
    // Convert Windows path to WSL path if necessary
    const wslPath = this.convertToWslPath(workingDirectory);

    // Create a WSL command that executes the specified command
    // with the specified working directory
    const wslCommand = `wsl -d ${this.distribution} --cd "${wslPath}" ${command.replace(/"/g, '\\"')}`;

    return await this.execAsync(wslCommand);
  }

  /**
   * Convert a Windows path to a WSL path.
   * @param windowsPath The Windows path to convert
   * @returns The equivalent WSL path
   */
  convertToWslPath(windowsPath: string): string {
    // If the path is already in WSL format, return it as is
    if (windowsPath.startsWith('/')) {
      return windowsPath;
    }

    // Get the drive letter
    const driveLetter = windowsPath.charAt(0).toLowerCase();

    // Remove the drive letter and colon, replace backslashes with forward slashes
    const pathWithoutDrive = windowsPath.substring(2).replace(/\\/g, '/');

    // Construct the WSL path
    return `/mnt/${driveLetter}${pathWithoutDrive}`;
  }
}
