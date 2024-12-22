<div align="center">
  <img src="../../assets/terraform-header.svg" alt="Terraform Command Examples">
</div>

# Terraform実行サンプル

このディレクトリには、Terraformの基本的なコマンドの使用例が含まれています。

## 初期化と設定

```bash
# プロジェクトの初期化
terraform init

# プロバイダーのアップグレード
terraform init -upgrade

# 作業ディレクトリの初期化（バックエンド設定含む）
terraform init -backend-config="backend.hcl"
```

## 計画と適用

```bash
# 実行計画の表示
terraform plan

# 特定の変数を指定して実行計画を表示
terraform plan -var="instance_count=2"

# 変数ファイルを使用
terraform plan -var-file="prod.tfvars"

# インフラストラクチャの作成/更新
terraform apply

# 自動承認でのインフラストラクチャ作成/更新
terraform apply -auto-approve
```

## 状態管理

```bash
# 現在の状態を表示
terraform show

# 状態ファイルの一覧表示
terraform state list

# 特定のリソースの状態を表示
terraform state show aws_instance.example

# リソースの状態を削除
terraform state rm aws_instance.example

# 状態のインポート
terraform import aws_instance.example i-1234567890abcdef0
```

## 破棄と削除

```bash
# リソースの削除計画を表示
terraform plan -destroy

# リソースの削除
terraform destroy

# 自動承認での削除
terraform destroy -auto-approve
```

## ワークスペース管理

```bash
# ワークスペース一覧の表示
terraform workspace list

# 新しいワークスペースの作成
terraform workspace new dev

# ワークスペースの切り替え
terraform workspace select prod

# 現在のワークスペースを表示
terraform workspace show
```

## フォーマットとバリデーション

```bash
# コードのフォーマット
terraform fmt

# 設定の検証
terraform validate
```

## その他の有用なコマンド

```bash
# プロバイダーとモジュールのアップグレード
terraform get -update

# 出力値の表示
terraform output

# 特定の出力値の表示
terraform output instance_ip

# バージョン情報の表示
terraform version
```

## サンプルファイル

[main.tf](./main.tf)には、基本的なAWSリソース（VPC、サブネット、EC2インスタンス）の設定例が含まれています。
