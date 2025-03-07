import { DEFAULT_ALLOWED_COMMANDS } from './command-executor-server.js';

interface CommandExecutorOptions {
  allowCommands?: string[];
  workingDirectory?: string;
}

const determineServerOptions = () => {
  // Process command line arguments.
  const allowCommandsArgIndex = process.argv.findIndex((arg) => arg.startsWith('--allowCommands='));
  const workingDirectoryArgIndex = process.argv.findIndex((arg) =>
    arg.startsWith('--workingDirectory='),
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

  return options;
};

export default determineServerOptions;
