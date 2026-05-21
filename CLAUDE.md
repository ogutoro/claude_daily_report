# 営業日報システム

## 使用技術

- 言語: TypeScript
- フレームワーク: Next.js(App Router)
- UIコンポーネント: shadcn/ui + Tailwind CSS
- APIスキーマ定義: OpenAPI(Zodによる検証)
- DBスキーマ定義: Prisma.js
- テスト: Vitest
- デプロイ: Google Cloud Run

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

# テスト（全体・CI用）
npm test

# テスト（watch モード）
cd frontend && npm test
cd backend && npm test

# カバレッジ
npm run coverage --workspace=frontend
npm run coverage --workspace=backend

# フォーマット
npm run format
npm run format:check
```

## DB セットアップ

### 初回セットアップ

```bash
# 1. 環境変数ファイルを作成
cp backend/.env.example backend/.env
# backend/.env の DATABASE_URL を実際の接続先に編集する

# 2. マイグレーション適用（ローカル開発）
cd backend && npm run db:migrate:dev

# 3. Prismaクライアント生成
cd backend && npm run db:generate
```

### DB スクリプト一覧（backend/）

| コマンド                 | 説明                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `npm run db:migrate:dev` | 開発環境でマイグレーションを適用（`prisma migrate dev`）                 |
| `npm run db:migrate`     | 本番/ステージング環境でマイグレーションを適用（`prisma migrate deploy`） |
| `npm run db:generate`    | Prismaクライアントを再生成                                               |
| `npm run db:reset`       | DBをリセットして全マイグレーションを再適用（`--force`）                  |

### 注意事項

- `backend/.env` はGit管理外（`.gitignore`対象）
- 接続URL形式: `postgresql://<user>:<password>@<host>:<port>/<database>`
- Prisma 7以降、接続URLは `backend/prisma.config.ts` で管理（`schema.prisma` には記載しない）

## デプロイ

### GCP 設定値

| 項目                              | 値                                                                     |
| --------------------------------- | ---------------------------------------------------------------------- |
| Project ID                        | `claude-test-app-20260521`                                             |
| リージョン                        | `asia-northeast1`                                                      |
| Artifact Registry                 | `asia-northeast1-docker.pkg.dev/claude-test-app-20260521/daily-report` |
| フロントエンド Cloud Run サービス | `daily-report-frontend`                                                |
| バックエンド Cloud Run サービス   | `daily-report-backend`                                                 |

### 初回セットアップ（一度だけ実行）

```bash
# Artifact Registry 作成・API 有効化
make gcp-setup

# Secret Manager にシークレットを登録
echo -n "postgresql://..." | gcloud secrets create DATABASE_URL \
  --data-file=- --project=claude-test-app-20260521

echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET \
  --data-file=- --project=claude-test-app-20260521
```

GitHub リポジトリの **Settings → Secrets → Actions** に以下を登録：

| シークレット名 | 内容                                             |
| -------------- | ------------------------------------------------ |
| `GCP_SA_KEY`   | サービスアカウントの JSON キー（下記ロール必須） |

サービスアカウントに必要なロール：

- `roles/run.admin`
- `roles/artifactregistry.writer`
- `roles/iam.serviceAccountUser`
- `roles/secretmanager.secretAccessor`

### CI/CD フロー

- **PR / main 以外へのプッシュ** → `.github/workflows/ci.yml` が lint・format・test を実行
- **main へのプッシュ** → `.github/workflows/deploy.yml` が lint・test → Docker ビルド → Artifact Registry プッシュ → Cloud Run デプロイ を順番に実行

### デプロイコマンド（Makefile）

```bash
# 全体をビルド → プッシュ → デプロイ（タグは git の短縮 SHA）
make deploy

# 任意タグでデプロイ
make deploy TAG=v1.2.0

# フロントエンドのみ
make deploy-frontend

# バックエンドのみ
make deploy-backend

# Docker ビルドのみ（プッシュなし・動作確認用）
make build
make build-frontend
make build-backend
```

## ドキュメント

### 画面設計

@doc/SCREEN_DESIGN.md

### API仕様書

@doc/API_SCHEME.md

### テスト仕様書

@doc/TEST_DEFINITION.md

### ER図

@doc/ER_DIAGRAM.md

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
