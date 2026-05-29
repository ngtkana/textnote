---
name: review-response
description: Handle PR review comments and respond in Japanese
arguments:
  - name: pr_number
    description: Pull request number (optional, defaults to current branch PR)
    required: false
---

# PR Review対応スキル

Pull Requestのレビューコメントに対応し、日本語で返信します。

## 実行手順

1. PR番号が未指定の場合、現在のブランチのPRを取得
2. レビューコメントを全て取得
3. 各コメントに対応してコードを修正
4. 修正をコミット
5. 各コメントに日本語で返信
6. PRのタイトル・descriptionを更新（必要に応じて）

## コメント返信の形式

**必ず日本語で書く**。以下の形式を使用：

```
対応しました！

修正内容:
- [具体的な修正内容]

コミット: [7桁のSHA]
```

## GitHub CLI コマンド

```bash
# レビューコメント取得
gh api "repos/{owner}/{repo}/pulls/{pr_number}/comments"

# コメントに返信
gh api "repos/{owner}/{repo}/pulls/comments/{comment_id}/replies" -X POST -f body="..."

# PR更新
gh pr edit {pr_number} --title "..." --body "..."
```
