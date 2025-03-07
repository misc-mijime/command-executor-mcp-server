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
} from '@modelcontextprotocol/sdk/types.js';

const execAsync = promisify(exec);

// Default list of allowed commands
const DEFAULT_ALLOWED_COMMANDS = ['git', 'ls', 'mkdir', 'cd', 'npm', 'npx', 'python'];

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
    // Use provided commands or default commands
    this.allowedCommands = options.allowCommands || DEFAULT_ALLOWED_COMMANDS;

    // Set working directory (use process current directory if not specified)
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
    // Get the first part of the command (first word in space-separated string)
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
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'execute_command') {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }

      const { command, workingDirectory } = request.params.arguments as {
        command: string;
        workingDirectory?: string;
      };

      // Check if command is allowed
      if (!this.isCommandAllowed(command)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Command not allowed: ${command}. Allowed commands: ${this.allowedCommands.join(', ')}`,
        );
      }

      try {
        // Determine execution directory (argument > default setting > current directory)
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
    });
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
  // Process command line arguments
  const allowCommandsArgIndex = process.argv.findIndex((arg) => arg.startsWith('--allowCommands='));
  const workingDirectoryArgIndex = process.argv.findIndex((arg) =>
    arg.startsWith('--workingDirectory='),
  );

  const options: CommandExecutorOptions = {};

  // Handle allowed commands argument
  if (allowCommandsArgIndex !== -1) {
    const commandsArg = process.argv[allowCommandsArgIndex].split('=')[1];
    options.allowCommands = commandsArg.split(',').map((cmd) => cmd.trim());
  } else if (process.env.ALLOWED_COMMANDS) {
    // Check environment variable
    options.allowCommands = process.env.ALLOWED_COMMANDS.split(',').map((cmd) => cmd.trim());
  }

  // Handle working directory argument
  if (workingDirectoryArgIndex !== -1) {
    const dirArg = process.argv[workingDirectoryArgIndex].split('=')[1];
    options.workingDirectory = dirArg;
  } else if (process.env.WORKING_DIRECTORY) {
    // Check environment variable
    options.workingDirectory = process.env.WORKING_DIRECTORY;
  }

  return options;
};

const options = determineServerOptions();
const server = new CommandExecutorServer(options);
server.run().catch(console.error);
