# 営業日報システム

## 構成

- `frontend/` — React + TypeScript（ESLint: react-hooks, react-refresh）
- `backend/` — Node.js + TypeScript（ESLint: node globals）
- npm workspaces でモノレポ管理

## コマンド

```bash
# Lint（全体）
npm run lint

# Lint（個別）
cd frontend && npm run lint
cd backend && npm run lint

# 自動修正
npm run lint:fix --workspace=frontend
npm run lint:fix --workspace=backend
```

## ドキュメント

### 画面設計

@doc/screen_definition.md

### API仕様書

@doc/api_specification.md

### テスト仕様書

@doc/test_specification.md

### ER図

@doc/er_diagram.md

## テストコード作成時の厳守事項(絶対に守ってください)

### テストコードの品質

- テストは必ず実際の機能を検証すること
- `expect(true).toBe(true)` のような意味のないアサーションは絶対に書かない
- 各テストケースは具体的な入力と期待される出力を検証すること
- モックは必要最小限に留め、実際の動作に近い形でテストすること

### ハードコーディングの禁止

- テストを通すためだけのハードコードは絶対に禁止
- 本番コードに `if (testMode)` のような条件分岐を入れない
- テスト用の特別な値（マジックナンバー）を本番コードに埋め込まない
- 環境変数や設定ファイルを使用して、テスト環境と本番環境を適切に分離すること

### テスト実装の原則

- テストが失敗する状態から始めること（Red-Green-Refactor）
- 境界値、異常系、エラーケースも必ずテストすること
- カバレッジだけでなく、実際の品質を重視すること
- テストケース名は何をテストしているか明確に記述すること

### 実装前の確認

- 機能の仕様を正しく理解してからテストを書くこと
- 不明な点があれば、仮の実装ではなく、ユーザーに確認すること

### その他

- コンパクトを使用するときは、コードの変更内容についてフォーカスしてください
