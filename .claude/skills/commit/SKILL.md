---
name: commit
description: emoji を利用した Conventional Commits 形式を利用して、適切にフォーマットされたコミットの作成を支援します。ユーザが「コミットして」「commit」「変更をコミット」などコミット作成に関するリクエストや /commit コマンドを使用したときにこのスキルを使用してください。 
---

## 以下の手順を実行します

1. 現在のブランチが`main`または`master`でないことを確認します
2. `main`または`master`ブランチの場合、`git diff`を実行してコミットされる変更内容を確認して、適切なブランチに切り替えてください
3. `git status`でどのファイルがステージされているかを確認します
4. ステージされたファイルが 0 個の場合、`git add`で変更されたファイルと新しいファイルを自動的に追加してください
5. `git diff`を実行してコミットされる変更内容を理解してください
6. diff を分析して、複数の異なる論理的変更が含まれているかを判定します
7. もし複数の論理的変更がある場合、それらを別々のコミットに分割してください
8. 各コミット（または分割されない場合は単一のコミット）に対して、emoji を利用した conventional commit 形式を使用してコミットメッセージを英語で作成
9. コミットを実行し、pre-commit チェックが失敗した場合は問題を修正してください

## 重要な注意事項

- デフォルトでは、コード品質を確保するために pre-commit チェックが実行されます
- これらのチェックが失敗した場合に`--no-verify`オプションを使用してコミットすることは推奨されません
- pre-commitのチェックが成功するよう、pre-commitのエラーメッセージをもとに問題を修正してください
- 特定のファイルが既にステージされている場合、コマンドはそれらのファイルのみをコミットします
- ステージされたファイルがない場合、変更されたファイルと新しいファイルを自動的にステージします
- コミットメッセージは検出された変更に基づいて構築されます
- コミット前に、複数のコミットがより適切かどうかを判断するために diff をレビューします
- 複数のコミットを提案する場合、変更を別々にステージしてコミットするのを支援します
- 常にコミット diff をレビューして、メッセージが変更と一致することを確認します

## コミットのベストプラクティス

- **コミット前の確認**: コードが lint されて正常にビルドでき、ドキュメントが更新されていることを確認しましょう
- **アトミックコミット**: 各コミットは単一の目的を果たすよう関連する変更を含むべき
- **大きな変更の分割**: 変更が複数の異なる論理的変更が含まれている場合は、別々のコミットに分割
- **Conventional commit 形式**: `<type>: <description>`の形式を使用。type は以下のいずれか：
    - `feat`: 新機能
    - `fix`: バグ修正
    - `docs`: ドキュメント変更
    - `style`: コードスタイル変更（フォーマットなど）
    - `refactor`: バグ修正でも機能追加でもないコード変更
    - `perf`: パフォーマンス改善
    - `test`: テストの追加または修正
    - `chore`: ビルドプロセス、ツールなどの変更
- **命令法**: コミットメッセージはコマンドとして記述（例：「機能を追加しました」ではなく「機能を追加」）
- **Emoji**: 各コミットタイプには適切な emoji が対応：
    - `feat`: ✨
    - `fix`: 🐛
    - `docs`: 📝
    - `style`: 💄
    - `refactor`: ♻️
    - `perf`: ⚡️
    - `test`: ✅
    - `chore`: 🔧

## コミット分割のガイドライン

diff を分析する際、以下の基準に基づいてコミットの分割を検討してください：

1. **異なる関心事**: コードベースの無関係な部分への変更
2. **異なるタイプの変更**: 機能、修正、リファクタリングなどの混在
3. **ファイルパターン**: 異なるタイプのファイルへの変更（例：ソースコード vs ドキュメント）
4. **論理的グループ分け**: 別々に理解またはレビューした方が分かりやすい変更
5. **サイズ**: 分割した方が明確になる非常に大きな変更

## 例

良いコミットメッセージ：

- ✨ feat: Add Cloud Run service account
- 🐛 fix: Change LLM inference timeout duration
- 📝 docs: Add documentation for experiment exp002
- 💄 style: Reorganize component structure for better readability
- ♻️ refactor: Simplify error handling logic in the parser
- 🔧 chore: Improve setup process for developer tools

コミット分割の例：

- 1つ目のコミット: ✨ feat: Add type definitions for the new solc version
- 2つ目のコミット: 📝 docs: Update documentation for the new solc version
- 3つ目のコミット: 🔧 chore: Update dependencies in package.json
- 4つ目のコミット: ✨ feat: Add type definitions for the new API endpoint
- 5つ目のコミット: ✨ feat: Improve concurrency handling with worker threads
- 6つ目のコミット: 🐛 fix: Resolve linting issues in the new code
- 7つ目のコミット: ✅ test: Add unit tests for new solc version features
- 8つ目のコミット: 🐛 fix: Update dependencies with security vulnerabilities
