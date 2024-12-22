#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 許可されたコマンドのプレフィックスリスト（環境変数から取得、デフォルト値を設定）
const DEFAULT_ALLOWED_COMMANDS = [
  'git',
  'ls',
  'mkdir',
  'cd',
  'npm',
  'npx',
  'python'
];

const getAllowedCommands = (): string[] => {
  const envCommands = process.env.ALLOWED_COMMANDS;
  if (!envCommands) {
    return DEFAULT_ALLOWED_COMMANDS;
  }
  return envCommands.split(',').map(cmd => cmd.trim());
};

class CommandExecutorServer {
  private server: Server;
  private allowedCommands: string[];

  constructor() {
    this.allowedCommands = getAllowedCommands();

    this.server = new Server(
      {
        name: 'command-executor',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // エラーハンドリング
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private isCommandAllowed(command: string): boolean {
    // コマンドの最初の部分（スペース区切りの最初の単語）を取得
    const commandPrefix = command.split(' ')[0];
    return this.allowedCommands.some(allowed => commandPrefix === allowed);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'execute_command',
          description: '事前に許可されたコマンドを実行します',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: '実行するコマンド',
              },
            },
            required: ['command'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'execute_command') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      const { command } = request.params.arguments as { command: string };

      // コマンドが許可されているか確認
      if (!this.isCommandAllowed(command)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Command not allowed: ${command}. Allowed commands: ${this.allowedCommands.join(', ')}`
        );
      }

      try {
        const { stdout, stderr } = await execAsync(command);
        return {
          content: [
            {
              type: 'text',
              text: stdout || stderr,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Command execution failed: ${error.message}`,
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
  }
}

const server = new CommandExecutorServer();
server.run().catch(console.error);
