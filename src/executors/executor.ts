/**
 * Interface for command executors that can run commands in different environments.
 */
export interface Executor {
  /**
   * Execute a command in the specific environment.
   * @param command The command to execute
   * @param workingDirectory The working directory where the command should be executed
   * @returns A promise that resolves to an object with stdout and stderr properties
   */
  execute(command: string, workingDirectory: string): Promise<{ stdout: string; stderr: string }>;
}
