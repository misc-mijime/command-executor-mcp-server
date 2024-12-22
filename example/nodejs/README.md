<div align="center">
  <img src="../../assets/nodejs-header.svg" alt="Node.js Command Examples">
</div>

# Node.js関連サンプル

このディレクトリには、npm/npxコマンドの使用例が含まれています。

## プロジェクト初期化と依存関係管理

```bash
# 新規プロジェクトの初期化
npm init -y

# パッケージのインストール
npm install express           # 依存関係として追加
npm install --save-dev jest  # 開発依存関係として追加

# グローバルパッケージのインストール
npm install -g typescript

# パッケージの更新
npm update

# パッケージの削除
npm uninstall package-name

# 依存関係の一覧表示
npm list
```

## スクリプトの実行

```bash
# package.jsonのscriptsセクションに定義されたコマンドの実行
npm run test
npm run build
npm run start

# 開発サーバーの起動（一般的な例）
npm run dev
```

## npxの使用例

```bash
# Create React Appを使用して新しいReactプロジェクトを作成
npx create-react-app my-app

# TypeScriptプロジェクトの初期化
npx tsc --init

# パッケージを一時的に実行
npx cowsay "Hello!"
```

## パッケージ管理のベストプラクティス

```bash
# package-lock.jsonを使用した一貫したインストール
npm ci

# 脆弱性のチェック
npm audit

# 脆弱性の修正
npm audit fix
```

## サンプルファイル

- [package.json](./package.json): プロジェクト設定ファイル
- [app.js](./app.js): シンプルなHTTPサーバーと非同期処理の例
