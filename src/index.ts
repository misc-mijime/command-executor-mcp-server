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

// デフォルトの許可コマンドリスト
const DEFAULT_ALLOWED_COMMANDS = ['git', 'ls', 'mkdir', 'cd', 'npm', 'npx', 'python'];

// オプションのインターフェース
interface CommandExecutorOptions {
  allowCommands?: string[];
  workingDirectory?: string;
}

class CommandExecutorServer {
  private server: Server;
  private allowedCommands: string[];
  private workingDirectory: string;

  constructor(options: CommandExecutorOptions = {}) {
    // オプションで渡されたコマンドか、デフォルトコマンドを使用
    this.allowedCommands = options.allowCommands || DEFAULT_ALLOWED_COMMANDS;

    // ワーキングディレクトリの設定（指定がない場合はプロセスのカレントディレクトリ）
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
    return this.allowedCommands.some((allowed) => commandPrefix === allowed);
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
              workingDirectory: {
                type: 'string',
                description: 'コマンド実行時のワーキングディレクトリ（オプション）',
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

      // コマンドが許可されているか確認
      if (!this.isCommandAllowed(command)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Command not allowed: ${command}. Allowed commands: ${this.allowedCommands.join(', ')}`,
        );
      }

      try {
        // コマンド実行時のディレクトリ決定（引数 > デフォルト設定 > カレントディレクトリ）
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
  // コマンドライン引数の処理
  const allowCommandsArgIndex = process.argv.findIndex((arg) => arg.startsWith('--allowCommands='));
  const workingDirectoryArgIndex = process.argv.findIndex((arg) =>
    arg.startsWith('--workingDirectory='),
  );

  const options: CommandExecutorOptions = {};

  // 許可コマンドの引数処理
  if (allowCommandsArgIndex !== -1) {
    const commandsArg = process.argv[allowCommandsArgIndex].split('=')[1];
    options.allowCommands = commandsArg.split(',').map((cmd) => cmd.trim());
  } else if (process.env.ALLOWED_COMMANDS) {
    // 環境変数の確認
    options.allowCommands = process.env.ALLOWED_COMMANDS.split(',').map((cmd) => cmd.trim());
  }

  // ワーキングディレクトリの引数処理
  if (workingDirectoryArgIndex !== -1) {
    const dirArg = process.argv[workingDirectoryArgIndex].split('=')[1];
    options.workingDirectory = dirArg;
  } else if (process.env.WORKING_DIRECTORY) {
    // 環境変数の確認
    options.workingDirectory = process.env.WORKING_DIRECTORY;
  }

  return options;
};

const options = determineServerOptions();
const server = new CommandExecutorServer(options);
server.run().catch(console.error);
