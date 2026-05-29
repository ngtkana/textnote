---
name: screenshot
description: 最新のスクリーンショットを表示する
---

# 最新のスクリーンショットを表示

OS設定を考慮して、最新のスクリーンショットを自動的に探して表示します。

## 実行手順

1. OSを検出
2. スクリーンショットの保存場所を特定
3. 最新のスクリーンショットファイルを検索
4. Readツールで画像を表示

## OS別のスクリーンショット保存場所

### macOS
- デフォルト: `~/Desktop`
- カスタム設定: `defaults read com.apple.screencapture location` で確認
- よくあるカスタム場所: `~/Documents/Screenshots`, `~/Pictures/Screenshots`

### Windows
- `%USERPROFILE%\Pictures\Screenshots`
- `%USERPROFILE%\OneDrive\Pictures\Screenshots`

### Linux
- GNOME: `~/Pictures`
- KDE: `~/Pictures`

## 実装

```bash
# 1. OSを検出
OS=$(uname -s)

# 2. macOSの場合、設定を確認
if [ "$OS" = "Darwin" ]; then
  # カスタム設定を確認
  SCREENSHOT_DIR=$(defaults read com.apple.screencapture location 2>/dev/null || echo "$HOME/Desktop")
  
  # 存在しない場合は他の候補を試す
  if [ ! -d "$SCREENSHOT_DIR" ]; then
    for dir in "$HOME/Documents/Screenshots" "$HOME/Pictures/Screenshots" "$HOME/Desktop"; do
      if [ -d "$dir" ]; then
        SCREENSHOT_DIR="$dir"
        break
      fi
    done
  fi
elif [ "$OS" = "Linux" ]; then
  SCREENSHOT_DIR="$HOME/Pictures"
elif [ "$OS" = "MINGW64_NT" ] || [ "$OS" = "MSYS_NT" ]; then
  # Windows (Git Bash)
  SCREENSHOT_DIR="$HOME/Pictures/Screenshots"
fi

# 3. 最新のスクリーンショットを検索
# 画像拡張子: png, jpg, jpeg
LATEST=$(find "$SCREENSHOT_DIR" -maxdepth 1 \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "スクリーンショットが見つかりませんでした。"
  echo "検索したディレクトリ: $SCREENSHOT_DIR"
  exit 1
fi

echo "$LATEST"
```

## 使い方

ユーザーが「最新のスクリーンショットを見て」「スクショ見て」などと言った場合:

1. 上記のbashスクリプトを実行して最新のファイルパスを取得
2. Readツールでそのファイルを表示
3. 画像の内容について説明またはユーザーの質問に回答

## 注意事項

- ファイルが見つからない場合は、ユーザーに保存場所を尋ねる
- macOSの場合、スクリーンショットのファイル名は通常「スクリーンショット YYYY-MM-DD HH.MM.SS.png」形式
- Windowsの場合、「Screenshot (N).png」形式
