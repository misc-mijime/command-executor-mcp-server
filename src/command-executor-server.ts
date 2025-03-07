import path from 'node:path';

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

import {
  ExecutionEnvironment,
  type Executor,
  type ExecutorOptions,
  createExecutor,
} from './executors/index.js';

// Default list of allowed commands
export const DEFAULT_ALLOWED_COMMANDS = ['git', 'ls', 'mkdir', 'npm', 'npx', 'python', 'make'];

// Options interface
interface CommandExecutorOptions {
  allowCommands?: string[];
  workingDirectory?: string;
  executorOptions?: ExecutorOptions;
}

class CommandExecutorServer {
  private server: Server;
  private allowedCommands: string[];
  private workingDirectory: string;
  private executor: Executor;

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

    // Create the appropriate executor based on the execution environment
    this.executor = createExecutor(options.executorOptions);

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

      // Use the executor to run the command
      const { stdout, stderr } = await this.executor.execute(command, executionDirectory);

      return {
        content: [
          {
            type: 'text',
            text: stdout || stderr,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : new String(error).toString();

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
      const message = error instanceof Error ? error.message : new String(error).toString();
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

    // Log the executor type being used
    const executorName = this.executor.constructor.name;
    console.error(`Using executor: ${executorName}`);
  }
}

export default CommandExecutorServer;
