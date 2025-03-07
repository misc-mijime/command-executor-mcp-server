#!/usr/bin/env node
import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type Result,
} from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

const execAsync = promisify(exec);

// Default list of allowed commands
const DEFAULT_ALLOWED_COMMANDS = ['git', 'ls', 'mkdir', 'npm', 'npx', 'python'];

// Options interface
interface CommandExecutorOptions {
  allowCommands?: string[];
  workingDirectory?: string;
}

class CommandExecutorServer {
  private server: Server;
  private allowedCommands: string[];
  private workingDirectory: string;

  constructor(options: CommandExecutorOptions = {}) {
    // Set allowed commands list.
    // If options.allowCommands is provided, add to the default command list.
    // Otherwise, use the default list.
    this.allowedCommands = options.allowCommands
      ? [...new Set([...DEFAULT_ALLOWED_COMMANDS, ...options.allowCommands])]
      : DEFAULT_ALLOWED_COMMANDS;

    // Set working directory.
    // If options.workingDirectory is provided, use it.
    // Otherwise, use the current directory of the process as default.
    this.workingDirectory = options.workingDirectory
      ? path.resolve(options.workingDirectory)
      : process.cwd();

    this.server = new Server(
      {
        name: 'command-executor',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private isCommandAllowed(command: string): boolean {
    // Get the first part of the command (first word in space-separated string).
    const commandPrefix = command.split(' ')[0];
    return this.allowedCommands.some((allowed) => commandPrefix === allowed);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'execute_command',
          description: `Execute a pre-approved command. Valid commands include: ${this.allowedCommands.join(', ')}. Use with caution and only execute trusted commands.`,
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Command to execute (e.g., "git clone", "ls -la", "npm install")',
              },
              workingDirectory: {
                type: 'string',
                description: 'Working directory for command execution (optional)',
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'add_allow_command',
          description:
            'Adds a command to the allowed command list. After adding, the command becomes available for the execute_command tool.',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Command to allow (e.g., "curl")',
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'change_working_directory',
          description:
            'Changes the default working directory of the server. If no working directory is specified in the execute_command tool, this directory will be used.',
          inputSchema: {
            type: 'object',
            properties: {
              workingDirectory: {
                type: 'string',
                description: 'Path to the new working directory (e.g., "/tmp/work")',
              },
            },
            required: ['workingDirectory'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;

      switch (toolName) {
        case 'execute_command':
          return this.handleExecuteCommand(request);
        case 'add_allow_command':
          return this.handleAddAllowCommand(request);
        case 'change_working_directory':
          return this.handleChangeWorkingDirectory(request);
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
      }
    });
  }

  private async handleExecuteCommand(
    request: z.infer<typeof CallToolRequestSchema>,
  ): Promise<Result> {
    const { command, workingDirectory } = request.params.arguments as {
      command: string;
      workingDirectory?: string;
    };

    // Check if command is allowed.
    if (!this.isCommandAllowed(command)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Command not allowed: ${command}. Allowed commands: ${this.allowedCommands.join(', ')}`,
      );
    }

    try {
      // Determine execution directory (argument > default setting > current directory).
      const executionDirectory = workingDirectory
        ? path.resolve(workingDirectory)
        : this.workingDirectory;

      const { stdout, stderr } = await execAsync(command, {
        cwd: executionDirectory,
      });

      return {
        content: [
          {
            type: 'text',
            text: stdout || stderr,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : new String(error);

      return {
        content: [
          {
            type: 'text',
            text: `Command execution failed: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleAddAllowCommand(
    request: z.infer<typeof CallToolRequestSchema>,
  ): Promise<Result> {
    const { command } = request.params.arguments as { command: string };

    if (this.allowedCommands.includes(command)) {
      return {
        content: [{ type: 'text', text: `Command "${command}" is already in the allow list.` }],
      };
    }

    this.allowedCommands.push(command);
    return {
      content: [
        { type: 'text', text: `Command "${command}" added to the allow list.` },
        { type: 'text', text: `Current allow list: ${this.allowedCommands.join(', ')}` },
      ],
    };
  }

  private async handleChangeWorkingDirectory(
    request: z.infer<typeof CallToolRequestSchema>,
  ): Promise<Result> {
    const { workingDirectory } = request.params.arguments as { workingDirectory: string };

    try {
      const resolvedPath = path.resolve(workingDirectory);
      this.workingDirectory = resolvedPath;
      return {
        content: [{ type: 'text', text: `Working directory changed to "${resolvedPath}".` }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : new String(error);
      return {
        content: [{ type: 'text', text: `Failed to change working directory: ${message}` }],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Command Executor MCP server running on stdio');
    console.error('Allowed commands:', this.allowedCommands.join(', '));
    console.error('Default working directory:', this.workingDirectory);
  }
}

export default CommandExecutorServer;

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

const options = determineServerOptions();
const server = new CommandExecutorServer(options);
server.run().catch(console.error);
