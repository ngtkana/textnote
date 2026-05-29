---
name: pr
description: Create a pull request with Japanese description
arguments:
  - name: base
    description: Base branch (defaults to main)
    required: false
---

# Pull Request作成スキル

現在のブランチからPull Requestを作成します。Descriptionは日本語で書かれます。

## 実行手順

1. 現在のブランチ名を取得
2. ブランチがリモートにpushされているか確認
3. されていなければpush
4. コミット履歴を確認してPRのタイトルと本文を作成
5. `gh pr create`でPRを作成

## PRタイトルの決め方

- ブランチの主要な変更内容を簡潔に（50文字以内）
- 日本語で書く
- 動詞で始める（例：「〜を追加」「〜を修正」「〜を改善」）

## PR本文の構成

```markdown
## 概要
[変更の概要を2-3文で]

## 主な変更点
- [変更点1]
- [変更点2]
- [変更点3]

## テスト方法
[動作確認の手順]

## 注意事項
[レビュアーが知っておくべきこと（あれば）]
```

## 使用例

```bash
# 基本的な使い方
/pr

# ベースブランチを指定
/pr main

# developブランチに対してPRを作成
/pr develop
```

## GitHub CLI コマンド

```bash
# PRを作成
gh pr create --base main --title "タイトル" --body "本文"

# PRの状態を確認
gh pr view

# PRのURLを取得
gh pr view --json url -q .url
```

## 実装のポイント

- コミットメッセージを解析してPR本文を自動生成
- 複数のコミットがある場合は、それぞれの変更をリストアップ
- Conventional Commitsの絵文字は除去して見やすく
- 日本語で統一された説明
