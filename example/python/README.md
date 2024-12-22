<div align="center">
  <img src="../../assets/python-header.svg" alt="Python Command Examples">
</div>

# Python実行サンプル

このディレクトリには、Pythonの実行に関するサンプルが含まれています。

## 基本的な実行コマンド

```bash
# Pythonスクリプトの実行
python script.py
python3 script.py  # Python3を明示的に指定

# モジュールとして実行
python -m module_name

# 対話型シェル
python
python3
```

## パッケージ管理（pip）

```bash
# パッケージのインストール
pip install package_name
pip3 install package_name

# 特定のバージョンをインストール
pip install package_name==1.0.0

# requirements.txtからインストール
pip install -r requirements.txt

# パッケージの一覧表示
pip list

# パッケージ情報の表示
pip show package_name

# パッケージのアップグレード
pip install --upgrade package_name

# パッケージのアンインストール
pip uninstall package_name
```

## 仮想環境の管理

```bash
# venv環境の作成
python -m venv myenv

# 仮想環境の有効化
# Windows
myenv\Scripts\activate
# Unix系
source myenv/bin/activate

# 仮想環境の無効化
deactivate
```

## その他の有用なコマンド

```bash
# Pythonのバージョン確認
python --version
python3 --version

# コードの構文チェック
python -m py_compile script.py

# 単体テストの実行
python -m unittest test_script.py

# コードフォーマット
python -m black script.py

# 型チェック（mypy使用時）
python -m mypy script.py
```

## サンプルスクリプト

[hello.py](./hello.py)には、基本的な関数定義と実行例が含まれています。
