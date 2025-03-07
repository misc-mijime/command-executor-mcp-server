import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { Executor } from './executor.js';

const execAsync = promisify(exec);

/**
 * An executor implementation that runs commands locally.
 */
export class LocalExecutor implements Executor {
  /**
   * Execute a command on the local machine.
   * @param command The command to execute
   * @param workingDirectory The working directory where the command should be executed
   * @returns A promise that resolves to an object with stdout and stderr properties
   */
  async execute(
    command: string,
    workingDirectory: string,
  ): Promise<{ stdout: string; stderr: string }> {
    return await execAsync(command, {
      cwd: workingDirectory,
    });
  }
}
