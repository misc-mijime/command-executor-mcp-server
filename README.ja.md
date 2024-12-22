<div align="center">

# command-executor MCP サーバー

   <img src="https://raw.githubusercontent.com/Sunwood-ai-labs/command-executor-mcp-server/refs/heads/master/assets/header.svg" alt="Command Executor MCP Server"/>
   
   <a href="README.md"><img src="https://img.shields.io/badge/english-document-white.svg" alt="EN doc"></a>
   <a href="README.ja.md"><img src="https://img.shields.io/badge/ドキュメント-日本語-white.svg" alt="JA doc"/></a>
</div>

事前に承認されたコマンドを安全に実行するためのModel Context Protocolサーバーです。

## ✨ 特徴

- 事前承認されたコマンドリストによる安全な実行
- 環境変数によるコマンドリストのカスタマイズ機能
- TypeScriptとMCP SDKを使用して構築
- stdioを介した通信による柔軟な統合
- エラーハンドリングとセキュリティ検証
- リアルタイムなコマンド出力ストリーミング

## 🚀 インストール

依存関係のインストール：
```bash
npm install
```

サーバーのビルド：
```bash
npm run build
```

開発時の自動リビルド：
```bash
npm run watch
```

## ⚙️ 設定

### 🔒 許可されたコマンド

デフォルトで以下のコマンドが許可されています：
- git
- ls
- mkdir
- cd
- npm
- npx
- python

`ALLOWED_COMMANDS`環境変数を設定することで、許可するコマンドをカスタマイズできます：

```bash
export ALLOWED_COMMANDS=git,ls,mkdir,python
```

### 🔌 Claude Desktopとの統合

Claude Desktopで使用するには、以下の場所にサーバー設定を追加してください：

MacOSの場合：
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

Windowsの場合：
```
%APPDATA%/Claude/claude_desktop_config.json
```

設定例：
```json
{
  "mcpServers": {
    "command-executor": {
      "command": "/path/to/command-executor/build/index.js"
    }
  }
}
```

## 🛡️ セキュリティに関する考慮事項

command-executorサーバーは以下のセキュリティ対策を実装しています：

1. 事前承認コマンドリスト
   - 明示的に許可されたコマンドのみ実行可能
   - デフォルトリストは制限的でセキュリティ重視
   - プレフィックスによるコマンドの検証でインジェクションを防止

2. コマンドの検証
   - コマンドプレフィックスの検証によりコマンドインジェクションを防止
   - セキュリティ向上のためのシェル実行の制限
   - 環境変数の適切なサニタイズ

3. エラーハンドリング
   - 未承認コマンドに対する包括的なエラーハンドリング
   - デバッグ用の明確なエラーメッセージ
   - コマンド失敗時のサーバー継続動作

4. 環境の分離
   - 独立した環境でのサーバー実行
   - 制御可能な環境変数
   - システムアクセスの制限

## 💻 開発

### 📁 プロジェクト構造

```
command-executor/
├─ src/
│  └─ index.ts      # メインサーバーの実装
├─ build/
│  └─ index.js      # コンパイル済みJavaScript
├─ assets/
│  └─ header.svg    # プロジェクトヘッダー画像
└─ package.json     # プロジェクト設定
```

### 🐛 デバッグ

MCPサーバーはstdioを介して通信するため、デバッグが難しい場合があります。[MCP Inspector](https://github.com/modelcontextprotocol/inspector)の使用を推奨します：

```bash
npm run inspector
```

InspectorはブラウザでデバッグツールにアクセスするためのURLを提供します。

## 🛠️ ツールAPI

サーバーは以下の単一のツールを提供します：

### execute_command

事前承認されたコマンドを実行します。

パラメータ：
- `command` (string, 必須)：実行するコマンド

リクエスト例：
```json
{
  "name": "execute_command",
  "arguments": {
    "command": "git status"
  }
}
```

レスポンス例：
```json
{
  "content": [
    {
      "type": "text",
      "text": "On branch main\nNothing to commit, working tree clean"
    }
  ]
}
```

エラーレスポンス：
```json
{
  "content": [
    {
      "type": "text",
      "text": "Command execution failed: Command not allowed"
    }
  ],
  "isError": true
}
```

## ❌ エラーハンドリング

サーバーは様々なシナリオに対して詳細なエラーメッセージを提供します：

1. 未承認コマンド
   ```json
   {
     "code": "InvalidParams",
     "message": "Command not allowed: [command]. Allowed commands: git, ls, mkdir, cd, npm, npx, python"
   }
   ```

2. 実行失敗
   ```json
   {
     "content": [
       {
         "type": "text",
         "text": "Command execution failed: [error message]"
       }
     ],
     "isError": true
   }
   ```

## 🤝 コントリビューション

1. リポジトリをフォーク
2. 機能ブランチを作成
3. 変更をコミット
4. ブランチにプッシュ
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています - 詳細はLICENSEファイルを参照してください。
