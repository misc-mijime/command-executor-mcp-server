import { DEFAULT_ALLOWED_COMMANDS } from './command-executor-server.js';
import { ExecutionEnvironment, type ExecutorOptions } from './executors/index.js';

interface CommandExecutorOptions {
  allowCommands?: string[];
  workingDirectory?: string;
  executorOptions?: ExecutorOptions;
}

const determineServerOptions = () => {
  // Process command line arguments.
  const allowCommandsArgIndex = process.argv.findIndex((arg) => arg.startsWith('--allowCommands='));
  const workingDirectoryArgIndex = process.argv.findIndex((arg) =>
    arg.startsWith('--workingDirectory='),
  );
  const executionEnvArgIndex = process.argv.findIndex((arg) => arg.startsWith('--executionEnv='));
  const containerIdArgIndex = process.argv.findIndex((arg) => arg.startsWith('--containerId='));
  const wslDistributionArgIndex = process.argv.findIndex((arg) =>
    arg.startsWith('--wslDistribution='),
  );

  const options: CommandExecutorOptions = {};

  // Handle allowed commands argument.
  if (allowCommandsArgIndex !== -1) {
    // Get default allowed command list.
    const defaultAllowedCommandsSet = new Set(DEFAULT_ALLOWED_COMMANDS);
    // Get additional allowed commands from command line arguments and add to Set (remove duplicates).
    const commandsArg = process.argv[allowCommandsArgIndex].split('=')[1];
    for (const cmd of commandsArg.split(',').map((cmd) => cmd.trim())) {
      defaultAllowedCommandsSet.add(cmd);
    }
    // Convert Set to array and set to options.allowCommands.
    options.allowCommands = Array.from(defaultAllowedCommandsSet);
  } else if (process.env.ALLOWED_COMMANDS) {
    // Similarly, add to the default list when getting allowed commands from environment variables.
    // Get default allowed command list.
    const defaultAllowedCommandsSet = new Set(DEFAULT_ALLOWED_COMMANDS);
    // Get additional allowed commands from environment variables and add to Set (remove duplicates).
    for (const cmd of process.env.ALLOWED_COMMANDS.split(',').map((cmd) => cmd.trim())) {
      defaultAllowedCommandsSet.add(cmd);
    }
    // Convert Set to array and set to options.allowCommands.
    options.allowCommands = Array.from(defaultAllowedCommandsSet);
  }

  // Handle working directory argument.
  if (workingDirectoryArgIndex !== -1) {
    const dirArg = process.argv[workingDirectoryArgIndex].split('=')[1];
    options.workingDirectory = dirArg;
  } else if (process.env.WORKING_DIRECTORY) {
    // Working directory can also be obtained from environment variables.
    options.workingDirectory = process.env.WORKING_DIRECTORY;
  }

  // Handle execution environment options
  const executorOptions: ExecutorOptions = {};

  // Set environment type
  if (executionEnvArgIndex !== -1) {
    const envArg = process.argv[executionEnvArgIndex].split('=')[1].toLowerCase();
    switch (envArg) {
      case 'docker':
        executorOptions.environment = ExecutionEnvironment.Docker;
        break;
      case 'wsl':
        executorOptions.environment = ExecutionEnvironment.WSL;
        break;
      default:
        executorOptions.environment = ExecutionEnvironment.Local;
    }
  } else if (process.env.EXECUTION_ENV) {
    const envArg = process.env.EXECUTION_ENV.toLowerCase();
    switch (envArg) {
      case 'docker':
        executorOptions.environment = ExecutionEnvironment.Docker;
        break;
      case 'wsl':
        executorOptions.environment = ExecutionEnvironment.WSL;
        break;
      default:
        executorOptions.environment = ExecutionEnvironment.Local;
    }
  }

  // Set container ID for Docker
  if (containerIdArgIndex !== -1) {
    executorOptions.containerId = process.argv[containerIdArgIndex].split('=')[1];
  } else if (process.env.CONTAINER_ID) {
    executorOptions.containerId = process.env.CONTAINER_ID;
  }

  // Set WSL distribution
  if (wslDistributionArgIndex !== -1) {
    executorOptions.wslDistribution = process.argv[wslDistributionArgIndex].split('=')[1];
  } else if (process.env.WSL_DISTRIBUTION) {
    executorOptions.wslDistribution = process.env.WSL_DISTRIBUTION;
  }

  // Add executor options if any were set
  if (Object.keys(executorOptions).length > 0) {
    options.executorOptions = executorOptions;
  }

  return options;
};

export default determineServerOptions;
