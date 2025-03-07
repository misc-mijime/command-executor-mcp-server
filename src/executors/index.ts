export * from './executor.js';
export * from './local-executor.js';
export * from './docker-executor.js';
export * from './wsl-executor.js';

// Factory function to create an executor based on the environment type
export enum ExecutionEnvironment {
  Local = 'local',
  Docker = 'docker',
  WSL = 'wsl',
}

export interface ExecutorOptions {
  // Common options
  environment?: ExecutionEnvironment;

  // Docker-specific options
  containerId?: string;

  // WSL-specific options
  wslDistribution?: string;
}

import { DockerExecutor } from './docker-executor.js';
import type { Executor } from './executor.js';
import { LocalExecutor } from './local-executor.js';
import { WslExecutor } from './wsl-executor.js';

/**
 * Create an appropriate executor based on the specified environment.
 * @param options The options for creating the executor
 * @returns An Executor implementation for the specified environment
 */
export function createExecutor(options: ExecutorOptions = {}): Executor {
  const environment = options.environment || ExecutionEnvironment.Local;

  switch (environment) {
    case ExecutionEnvironment.Docker:
      if (!options.containerId) {
        throw new Error('Container ID is required for Docker executor');
      }
      return new DockerExecutor(options.containerId);

    case ExecutionEnvironment.WSL:
      return new WslExecutor(options.wslDistribution);
    default:
      return new LocalExecutor();
  }
}
