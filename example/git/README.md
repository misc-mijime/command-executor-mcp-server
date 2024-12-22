<div align="center">
  <img src="../../assets/git-header.svg" alt="Git Command Examples">
</div>

# Git操作サンプル

このディレクトリには、Git操作のサンプルスクリプトが含まれています。

## 基本的な操作

```bash
# リポジトリの初期化
git init

# ファイルの追加
git add .
git add filename.txt

# 変更の確認
git status

# 差分の確認
git diff
```

## コミット操作

```bash
# 変更のコミット
git commit -m "コミットメッセージ"

# 直前のコミットの修正
git commit --amend

# コミット履歴の確認
git log
git log --oneline
```

## ブランチ操作

```bash
# ブランチの作成
git branch feature/new-feature

# ブランチの切り替え
git checkout feature/new-feature
# または
git switch feature/new-feature

# ブランチの作成と切り替えを同時に行う
git checkout -b feature/new-feature

# ブランチ一覧の表示
git branch
git branch -a  # リモートブランチも含めて表示
```

## リモートリポジトリ操作

```bash
# リモートリポジトリの追加
git remote add origin https://github.com/username/repo.git

# 変更のプッシュ
git push origin main
git push -u origin main  # 上流ブランチの設定を含む

# リモートの変更の取得
git fetch origin

# リモートの変更の取得とマージ
git pull origin main
```

## その他の操作

```bash
# 変更の退避
git stash
git stash pop

# タグの作成
git tag v1.0.0

# 特定のコミットに戻る
git reset --hard commit-hash

# 変更の取り消し
git checkout -- filename.txt
```

## サンプルファイル

[.gitignore](./.gitignore)には、一般的なGitの除外設定例が含まれています。
このファイルを参考に、プロジェクトに応じた除外設定を行うことができます。
