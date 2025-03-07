import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { Executor } from './executor.js';

const execAsync = promisify(exec);

/**
 * An executor implementation that runs commands inside a Docker container.
 */
export class DockerExecutor implements Executor {
  private readonly containerId: string;

  /**
   * Create a new Docker executor.
   * @param containerId The ID or name of the Docker container to execute commands in
   */
  constructor(containerId: string) {
    this.containerId = containerId;
  }

  /**
   * Execute a command inside a Docker container.
   * @param command The command to execute
   * @param workingDirectory The working directory where the command should be executed
   * @returns A promise that resolves to an object with stdout and stderr properties
   */
  async execute(
    command: string,
    workingDirectory: string,
  ): Promise<{ stdout: string; stderr: string }> {
    // Create a Docker command that executes the specified command in the container
    // with the specified working directory
    const dockerCommand = `docker exec -w "${workingDirectory}" ${this.containerId} /bin/sh -c "${command.replace(/"/g, '\\"')}"`;

    return await execAsync(dockerCommand);
  }
}
