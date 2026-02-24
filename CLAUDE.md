# CLAUDE.md

## プロジェクト概要

[chakra-ui/eslint-plugin-panda](https://github.com/chakra-ui/eslint-plugin-panda)
の fork。ESLint ルールに加え、oxlint 互換のルール実装（`plugin/src/oxlint/`）を持つ。

パッケージ名: `@azu/eslint-plugin-panda-oxc`

## ディレクトリ構成

- `plugin/src/rules/` — ESLint ルール（upstream 由来）
- `plugin/src/oxlint/rules/` — oxlint 互換ルール（fork で追加）
- `plugin/src/oxlint/context.ts` — panda-data.json のロードと生成
- `plugin/src/oxlint/helpers.ts` — oxlint 版ヘルパー
- `plugin/tests/` — ESLint 版テスト（oxlint 版と共有）
- `sandbox/` — ESLint 設定のサンプル

## テスト戦略

ESLint 版と oxlint 版で同じテストファイルを共有している。

- `pnpm test` — ESLint 版 + oxlint 版の両方を実行
- `pnpm test:eslint` — ESLint 版のみ
- `pnpm test:oxlint` — oxlint 版のみ

oxlint 版のテストは `vitest.config.oxlint.mts` で `resolve.alias` を使い import を差し替えている:

- `../src/rules/` → `../src/oxlint/rules/`（ルール本体）
- `../test-utils` → `../test-utils-oxlint`（settings 付き RuleTester）

oxlint ルールは ESLint ルールと同じ export 形状（`export default rule` + `export const RULE_NAME`）を維持すること。

## upstream からの変更取り込み

upstream: https://github.com/chakra-ui/eslint-plugin-panda

```bash
git remote add upstream https://github.com/chakra-ui/eslint-plugin-panda.git
git fetch upstream
git merge upstream/main
```

コンフリクトが起きやすい箇所:

- `plugin/src/rules/` — upstream のルール変更。マージ後、oxlint 版にも同じ変更を反映する
- `package.json` — パッケージ名やスクリプトが異なる。fork 側を優先
- `.github/workflows/` — CI 設定が異なる。fork 側を優先
- `plugin/package.json` — パッケージ名が異なる。fork 側を優先

手順:

1. `git fetch upstream && git merge upstream/main` でマージ
2. コンフリクトを解決（fork 側の変更を優先する箇所に注意）
3. upstream の ESLint ルールに変更があれば、oxlint 版にも反映する
4. `pnpm test` で ESLint 版 + oxlint 版の両方のテストが通ることを確認

## リリース

npm OIDC Trusted Publisher を使用。`.github/workflows/release-oxc.yml` で PR マージ時にリリース。

1. `plugin/package.json` の version を更新
2. release PR を作成（`.github/workflows/create-release-pr.yml`）
3. PR マージでリリースが実行される

## コマンド

- `pnpm test` — 全テスト実行
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript 型チェック
- `pnpm prettier` — フォーマットチェック
- `pnpm build` — ビルド
- `pnpm build:docs` — ドキュメント生成
