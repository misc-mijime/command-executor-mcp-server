<div align="center">
  <img src="../../assets/file-operations-header.svg" alt="File Operations Examples">
</div>

# ファイル操作サンプル

このディレクトリには、基本的なファイル操作のサンプルが含まれています。

## ディレクトリ操作

```bash
# ディレクトリの作成
mkdir new_directory

# ディレクトリの移動
cd new_directory

# 現在のディレクトリの内容表示（Windows）
dir

# 現在のディレクトリの内容表示（Unix系）
ls
ls -la  # 詳細表示

# ディレクトリの削除
rmdir empty_directory    # 空のディレクトリの場合
rm -rf directory        # ディレクトリとその中身を削除（Unix系）
rd /s /q directory     # ディレクトリとその中身を削除（Windows）
```

## ファイル操作

```bash
# ファイルの内容表示（Windows）
type filename.txt

# ファイルの内容表示（Unix系）
cat filename.txt

# ファイルのコピー
copy source.txt destination.txt  # Windows
cp source.txt destination.txt    # Unix系

# ファイルの移動/名前変更
move old.txt new.txt    # Windows
mv old.txt new.txt      # Unix系

# ファイルの削除
del filename.txt        # Windows
rm filename.txt         # Unix系
```

## サンプルファイル

[sample.txt](./sample.txt)には、基本的なファイル操作を試すためのテキストが含まれています。
このファイルを使って、上記のコマンドを実際に試すことができます。
