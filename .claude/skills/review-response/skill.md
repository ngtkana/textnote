---
name: review-response
description: Handle PR review comments and respond in Japanese
arguments:
  - name: pr_number
    description: Pull request number (optional, defaults to current branch PR)
    required: false
---

# PR Review対応スキル

Pull Requestのレビューコメントに対応し、**各コメントに個別に**日本語で返信します。

## 実行手順

1. PR番号が未指定の場合、現在のブランチのPRを取得
2. レビューコメントを全て取得
3. 各コメントに対応してコードを修正
4. 修正をコミット
5. **各コメントに個別に返信**（重要！）
6. PRのタイトル・descriptionを更新（必要に応じて）

## 重要：各コメントに個別に返信する

PRに1つのコメントを投稿するのではなく、**各レビューコメントに対して個別に返信**してください。

- ❌ 悪い例：PRに1つのまとめコメントを投稿
- ✅ 良い例：レビューコメントが6つあれば、6つの返信を投稿

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
gh api "repos/{owner}/{repo}/pulls/{pr_number}/comments" --jq '.[] | {id, path, line, body}'

# 各コメントに返信（ループで処理）
gh api "repos/{owner}/{repo}/pulls/1/comments/{comment_id}/replies" -X POST -F body="..."

# PR更新
gh pr edit {pr_number} --title "..." --body "..."
```

## 実装例

```bash
# 各コメントに返信
COMMIT_SHA=$(git rev-parse --short HEAD)

# コメント1に返信
gh api "repos/owner/repo/pulls/1/comments/12345/replies" -X POST -F body="対応しました！

修正内容:
- 具体的な修正内容

コミット: $COMMIT_SHA"

# コメント2に返信
gh api "repos/owner/repo/pulls/1/comments/12346/replies" -X POST -F body="対応しました！

修正内容:
- 具体的な修正内容

コミット: $COMMIT_SHA"
```
