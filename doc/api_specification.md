# 営業日報システム — API仕様書

**バージョン**: 1.0  
**作成日**: 2026-05-13  
**Base URL**: `https://api.example.com/v1`  
**データ形式**: JSON  
**文字コード**: UTF-8

---

## 目次

1. [共通仕様](#1-共通仕様)
2. [認証 API](#2-認証-api)
3. [日報 API](#3-日報-api)
4. [訪問記録 API](#4-訪問記録-api)
5. [コメント API](#5-コメント-api)
6. [顧客マスタ API](#6-顧客マスタ-api)
7. [営業マスタ API](#7-営業マスタ-api)
8. [チーム API](#8-チーム-api)
9. [エラーレスポンス一覧](#9-エラーレスポンス一覧)

---

## 1. 共通仕様

### 1-1. 認証

すべてのエンドポイント（ログインを除く）はリクエストヘッダーに JWT トークンが必要。

```
Authorization: Bearer <token>
```

### 1-2. リクエストヘッダー

| ヘッダー | 値 | 必須 |
|---------|-----|------|
| `Content-Type` | `application/json` | ○（POST/PUT/PATCH） |
| `Authorization` | `Bearer <token>` | ○（認証済みエンドポイント） |

### 1-3. ページネーション

一覧系エンドポイントは共通のクエリパラメータでページネーションを行う。

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `page` | integer | 1 | ページ番号（1始まり） |
| `per_page` | integer | 20 | 1ページの件数（最大100） |

レスポンスには以下のメタ情報を含む。

```json
{
  "data": [...],
  "meta": {
    "total": 85,
    "page": 1,
    "per_page": 20,
    "total_pages": 5
  }
}
```

### 1-4. 日付・時刻フォーマット

| 種別 | フォーマット | 例 |
|------|------------|-----|
| 日付 | `YYYY-MM-DD` | `2026-05-13` |
| 時刻 | `HH:mm` | `14:30` |
| 日時 | ISO 8601 UTC | `2026-05-13T05:30:00Z` |

### 1-5. ロール定義

| 値 | 説明 |
|----|------|
| `sales` | 営業担当者 |
| `manager` | マネージャー（上長） |
| `admin` | 管理者 |

### 1-6. ステータス定義

#### 日報ステータス

| 値 | 説明 |
|----|------|
| `draft` | 下書き |
| `submitted` | 提出済み |

#### コメント対象

| 値 | 説明 |
|----|------|
| `problem` | 課題・相談へのコメント |
| `plan` | 明日やることへのコメント |

---

## 2. 認証 API

### POST `/auth/login`

ログイン。メールアドレスとパスワードで認証し、JWT トークンを返す。

**認証**: 不要

#### リクエスト

```json
{
  "email": "yamada@example.com",
  "password": "password123"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `email` | string | ○ | メールアドレス |
| `password` | string | ○ | パスワード |

#### レスポンス `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "山田 太郎",
    "email": "yamada@example.com",
    "role": "sales",
    "team_id": "550e8400-e29b-41d4-a716-446655440001",
    "team_name": "東日本営業チーム"
  }
}
```

#### エラー

| ステータス | コード | 説明 |
|-----------|--------|------|
| 401 | `INVALID_CREDENTIALS` | メールアドレスまたはパスワードが不正 |

---

### POST `/auth/logout`

ログアウト。サーバー側でトークンを無効化する。

**認証**: 必要

#### レスポンス `204 No Content`

---

## 3. 日報 API

### GET `/reports`

日報一覧を取得する。営業は自分の日報のみ取得可能。マネージャー・管理者はチーム全体を取得可能。

**認証**: 必要  
**権限**: 全ロール

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `user_id` | string (UUID) | — | 担当者で絞り込み（manager/admin のみ有効） |
| `status` | string | — | `draft` / `submitted` |
| `date_from` | string (YYYY-MM-DD) | — | 期間開始日 |
| `date_to` | string (YYYY-MM-DD) | — | 期間終了日 |
| `page` | integer | — | ページ番号（デフォルト: 1） |
| `per_page` | integer | — | 件数（デフォルト: 20） |

#### レスポンス `200 OK`

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "report_date": "2026-05-13",
      "status": "submitted",
      "submitted_at": "2026-05-13T09:00:00Z",
      "created_at": "2026-05-13T07:30:00Z",
      "updated_at": "2026-05-13T09:00:00Z",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "山田 太郎"
      },
      "visit_summary": {
        "count": 3,
        "first_customer_name": "株式会社A"
      }
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "per_page": 20,
    "total_pages": 3
  }
}
```

---

### GET `/reports/:id`

日報詳細を取得する。訪問記録・コメントを含む。

**認証**: 必要  
**権限**: 本人 / manager / admin

#### レスポンス `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "report_date": "2026-05-13",
  "problem": "株式会社Bへの提案資料について上長に相談したい。",
  "plan": "株式会社B向け比較表の作成。",
  "status": "submitted",
  "submitted_at": "2026-05-13T09:00:00Z",
  "created_at": "2026-05-13T07:30:00Z",
  "updated_at": "2026-05-13T09:00:00Z",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "山田 太郎"
  },
  "visit_records": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "visit_time": "14:00",
      "content": "新製品のデモを実施。担当者の反応は良好。",
      "sort_order": 1,
      "customer": {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "company_name": "株式会社A",
        "name": "田中 一郎"
      }
    }
  ],
  "comments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440040",
      "target": "problem",
      "body": "先週の提案書をベースに修正してみて。",
      "created_at": "2026-05-13T10:15:00Z",
      "commenter": {
        "id": "550e8400-e29b-41d4-a716-446655440050",
        "name": "鈴木 部長"
      }
    }
  ]
}
```

#### エラー

| ステータス | コード | 説明 |
|-----------|--------|------|
| 403 | `FORBIDDEN` | 他ユーザーの日報に営業がアクセス |
| 404 | `NOT_FOUND` | 日報が存在しない |

---

### POST `/reports`

日報を新規作成する。

**認証**: 必要  
**権限**: sales

#### リクエスト

```json
{
  "report_date": "2026-05-13",
  "problem": "株式会社Bへの提案資料について上長に相談したい。",
  "plan": "株式会社B向け比較表の作成。",
  "status": "draft",
  "visit_records": [
    {
      "customer_id": "550e8400-e29b-41d4-a716-446655440030",
      "visit_time": "14:00",
      "content": "新製品のデモを実施。担当者の反応は良好。",
      "sort_order": 1
    },
    {
      "customer_id": "550e8400-e29b-41d4-a716-446655440031",
      "visit_time": "16:30",
      "content": "競合他社との比較表を要求された。",
      "sort_order": 2
    }
  ]
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `report_date` | string (YYYY-MM-DD) | ○ | 日報の日付。未来日・同日重複は不可 |
| `problem` | string | — | 課題・相談（2000文字以下） |
| `plan` | string | — | 明日やること（2000文字以下） |
| `status` | string | ○ | `draft` / `submitted` |
| `visit_records` | array | ○ | 訪問記録（1件以上必須） |
| `visit_records[].customer_id` | string (UUID) | ○ | 顧客ID |
| `visit_records[].visit_time` | string (HH:mm) | — | 訪問時刻 |
| `visit_records[].content` | string | ○ | 訪問内容（2000文字以下） |
| `visit_records[].sort_order` | integer | ○ | 表示順（1始まり） |

#### レスポンス `201 Created`

作成した日報の詳細（`GET /reports/:id` と同形式）を返す。

#### エラー

| ステータス | コード | 説明 |
|-----------|--------|------|
| 400 | `VALIDATION_ERROR` | バリデーションエラー |
| 409 | `DUPLICATE_REPORT` | 同一日付の日報が既に存在する |

---

### PUT `/reports/:id`

日報を更新する。訪問記録は全件差し替え（送信した配列で上書き）。

**認証**: 必要  
**権限**: 本人のみ。提出済みかつ翌日以降は不可

#### リクエスト

`POST /reports` と同形式。

#### レスポンス `200 OK`

更新後の日報詳細（`GET /reports/:id` と同形式）を返す。

#### エラー

| ステータス | コード | 説明 |
|-----------|--------|------|
| 400 | `VALIDATION_ERROR` | バリデーションエラー |
| 403 | `FORBIDDEN` | 他ユーザーの日報、または編集期限切れ |
| 404 | `NOT_FOUND` | 日報が存在しない |

---

## 4. 訪問記録 API

訪問記録は `POST /reports` / `PUT /reports/:id` で日報と一括で操作するのが基本だが、単体での追加・削除も提供する。

---

### POST `/reports/:report_id/visit_records`

訪問記録を1件追加する。

**認証**: 必要  
**権限**: 本人のみ。編集可能期間内

#### リクエスト

```json
{
  "customer_id": "550e8400-e29b-41d4-a716-446655440030",
  "visit_time": "10:00",
  "content": "契約更新の打ち合わせ。次回までに見積もり送付。",
  "sort_order": 3
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `customer_id` | string (UUID) | ○ | 顧客ID |
| `visit_time` | string (HH:mm) | — | 訪問時刻 |
| `content` | string | ○ | 訪問内容（2000文字以下） |
| `sort_order` | integer | ○ | 表示順 |

#### レスポンス `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440021",
  "customer_id": "550e8400-e29b-41d4-a716-446655440030",
  "visit_time": "10:00",
  "content": "契約更新の打ち合わせ。次回までに見積もり送付。",
  "sort_order": 3,
  "customer": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "company_name": "株式会社A",
    "name": "田中 一郎"
  }
}
```

---

### DELETE `/reports/:report_id/visit_records/:id`

訪問記録を1件削除する。

**認証**: 必要  
**権限**: 本人のみ。編集可能期間内

#### レスポンス `204 No Content`

#### エラー

| ステータス | コード | 説明 |
|-----------|--------|------|
| 400 | `LAST_VISIT_RECORD` | 最後の1件は削除不可 |
| 403 | `FORBIDDEN` | 権限なし、または編集期限切れ |
| 404 | `NOT_FOUND` | 訪問記録が存在しない |

---

## 5. コメント API

### POST `/reports/:report_id/comments`

日報の Problem または Plan にコメントを投稿する。

**認証**: 必要  
**権限**: manager / admin

#### リクエスト

```json
{
  "target": "problem",
  "body": "先週の提案書をベースに修正してみて。"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `target` | string | ○ | `problem` / `plan` |
| `body` | string | ○ | コメント本文（1000文字以下） |

#### レスポンス `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440040",
  "target": "problem",
  "body": "先週の提案書をベースに修正してみて。",
  "created_at": "2026-05-13T10:15:00Z",
  "commenter": {
    "id": "550e8400-e29b-41d4-a716-446655440050",
    "name": "鈴木 部長"
  }
}
```

#### エラー

| ステータス | コード | 説明 |
|-----------|--------|------|
| 400 | `VALIDATION_ERROR` | バリデーションエラー |
| 403 | `FORBIDDEN` | 権限なし（salesロール） |
| 404 | `NOT_FOUND` | 日報が存在しない |

---

### DELETE `/reports/:report_id/comments/:id`

コメントを削除する。投稿者本人のみ削除可能。

**認証**: 必要  
**権限**: 投稿者本人（manager / admin）

#### レスポンス `204 No Content`

#### エラー

| ステータス | コード | 説明 |
|-----------|--------|------|
| 403 | `FORBIDDEN` | 他者のコメントは削除不可 |
| 404 | `NOT_FOUND` | コメントが存在しない |

---

## 6. 顧客マスタ API

### GET `/customers`

顧客一覧を取得する。論理削除済みは除外。

**認証**: 必要  
**権限**: 全ロール

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `q` | string | — | 会社名・担当者名の部分一致検索 |
| `page` | integer | — | ページ番号 |
| `per_page` | integer | — | 件数 |

#### レスポンス `200 OK`

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "company_name": "株式会社A",
      "name": "田中 一郎",
      "department": "営業部",
      "phone": "03-1234-5678",
      "email": "tanaka@company-a.example.com",
      "address": "東京都千代田区〇〇1-1-1",
      "notes": "毎月第1火曜に定例MTG",
      "created_at": "2026-01-15T00:00:00Z",
      "updated_at": "2026-04-20T00:00:00Z"
    }
  ],
  "meta": {
    "total": 58,
    "page": 1,
    "per_page": 20,
    "total_pages": 3
  }
}
```

---

### GET `/customers/:id`

顧客詳細を取得する。

**認証**: 必要  
**権限**: 全ロール

#### レスポンス `200 OK`

`GET /customers` の1件分と同形式。

#### エラー

| ステータス | コード | 説明 |
|-----------|--------|------|
| 404 | `NOT_FOUND` | 顧客が存在しない、または論理削除済み |

---

### POST `/customers`

顧客を新規登録する。

**認証**: 必要  
**権限**: manager / admin

#### リクエスト

```json
{
  "company_name": "株式会社C",
  "name": "佐藤 花子",
  "department": "購買部",
  "phone": "06-9876-5432",
  "email": "sato@company-c.example.com",
  "address": "大阪府大阪市〇〇2-2-2",
  "notes": ""
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|----------------|
| `company_name` | string | ○ | 100文字以下 |
| `name` | string | ○ | 50文字以下 |
| `department` | string | — | 100文字以下 |
| `phone` | string | — | 数字・ハイフンのみ |
| `email` | string | — | メール形式 |
| `address` | string | — | 200文字以下 |
| `notes` | string | — | 1000文字以下 |

#### レスポンス `201 Created`

作成した顧客の詳細（`GET /customers/:id` と同形式）を返す。

---

### PUT `/customers/:id`

顧客情報を更新する。

**認証**: 必要  
**権限**: manager / admin

#### リクエスト

`POST /customers` と同形式。

#### レスポンス `200 OK`

更新後の顧客詳細（`GET /customers/:id` と同形式）を返す。

#### エラー

| ステータス | コード | 説明 |
|-----------|--------|------|
| 400 | `VALIDATION_ERROR` | バリデーションエラー |
| 404 | `NOT_FOUND` | 顧客が存在しない |

---

### DELETE `/customers/:id`

顧客を論理削除する（`deleted_at` に現在時刻をセット）。

**認証**: 必要  
**権限**: manager / admin

#### レスポンス `204 No Content`

#### エラー

| ステータス | コード | 説明 |
|-----------|--------|------|
| 404 | `NOT_FOUND` | 顧客が存在しない、または既に削除済み |

---

## 7. 営業マスタ API

### GET `/users`

ユーザー一覧を取得する。論理削除済みは除外。

**認証**: 必要  
**権限**: admin

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `team_id` | string (UUID) | — | チームで絞り込み |
| `role` | string | — | `sales` / `manager` / `admin` |
| `page` | integer | — | ページ番号 |
| `per_page` | integer | — | 件数 |

#### レスポンス `200 OK`

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "山田 太郎",
      "email": "yamada@example.com",
      "role": "sales",
      "team": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "東日本営業チーム"
      },
      "created_at": "2026-01-10T00:00:00Z"
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "per_page": 20,
    "total_pages": 1
  }
}
```

---

### GET `/users/:id`

ユーザー詳細を取得する。

**認証**: 必要  
**権限**: admin

#### レスポンス `200 OK`

`GET /users` の1件分と同形式。

---

### POST `/users`

ユーザーを新規登録する。

**認証**: 必要  
**権限**: admin

#### リクエスト

```json
{
  "name": "鈴木 次郎",
  "email": "suzuki@example.com",
  "password": "securepassword",
  "role": "sales",
  "team_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|----------------|
| `name` | string | ○ | 50文字以下 |
| `email` | string | ○ | メール形式・一意 |
| `password` | string | ○ | 8文字以上 |
| `role` | string | ○ | `sales` / `manager` / `admin` |
| `team_id` | string (UUID) | — | 存在するチームID |

#### レスポンス `201 Created`

作成したユーザーの詳細（パスワードは含まない）を返す。

#### エラー

| ステータス | コード | 説明 |
|-----------|--------|------|
| 400 | `VALIDATION_ERROR` | バリデーションエラー |
| 409 | `DUPLICATE_EMAIL` | メールアドレスが既に使用されている |

---

### PUT `/users/:id`

ユーザー情報を更新する。パスワードを省略した場合は変更しない。

**認証**: 必要  
**権限**: admin

#### リクエスト

```json
{
  "name": "鈴木 次郎",
  "email": "suzuki@example.com",
  "password": "newpassword",
  "role": "manager",
  "team_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

`password` は省略可能（省略時は変更なし）。他フィールドは `POST /users` と同様。

#### レスポンス `200 OK`

更新後のユーザー詳細（`GET /users/:id` と同形式）を返す。

---

### DELETE `/users/:id`

ユーザーを論理削除する（`deleted_at` に現在時刻をセット）。

**認証**: 必要  
**権限**: admin

#### レスポンス `204 No Content`

#### エラー

| ステータス | コード | 説明 |
|-----------|--------|------|
| 400 | `CANNOT_DELETE_SELF` | 自分自身は削除不可 |
| 404 | `NOT_FOUND` | ユーザーが存在しない、または既に削除済み |

---

## 8. チーム API

### GET `/teams`

チーム一覧を取得する。

**認証**: 必要  
**権限**: 全ロール

#### レスポンス `200 OK`

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "東日本営業チーム"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "西日本営業チーム"
    }
  ]
}
```

> チームはページネーションなし（件数が少ないため全件返却）。

---

### POST `/teams`

チームを新規作成する。

**認証**: 必要  
**権限**: admin

#### リクエスト

```json
{
  "name": "中部営業チーム"
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|----------------|
| `name` | string | ○ | 100文字以下・一意 |

#### レスポンス `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "name": "中部営業チーム"
}
```

---

### PUT `/teams/:id`

チーム名を更新する。

**認証**: 必要  
**権限**: admin

#### リクエスト

`POST /teams` と同形式。

#### レスポンス `200 OK`

更新後のチーム情報を返す。

---

## 9. エラーレスポンス一覧

### エラーレスポンス形式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値に誤りがあります。",
    "details": [
      {
        "field": "report_date",
        "message": "未来の日付は指定できません。"
      },
      {
        "field": "visit_records",
        "message": "訪問記録は1件以上必要です。"
      }
    ]
  }
}
```

`details` はバリデーションエラー時のみ含まれる。

### HTTPステータスコード一覧

| ステータス | 用途 |
|-----------|------|
| 200 | 取得・更新成功 |
| 201 | 作成成功 |
| 204 | 削除成功（レスポンスボディなし） |
| 400 | リクエスト不正・バリデーションエラー |
| 401 | 未認証（トークンなし・無効） |
| 403 | 権限なし |
| 404 | リソースが存在しない |
| 409 | 競合（重複登録など） |
| 500 | サーバー内部エラー |

### エラーコード一覧

| コード | 説明 |
|--------|------|
| `VALIDATION_ERROR` | バリデーション失敗 |
| `INVALID_CREDENTIALS` | 認証情報が不正 |
| `UNAUTHORIZED` | 未認証 |
| `FORBIDDEN` | 権限なし |
| `NOT_FOUND` | リソースが存在しない |
| `DUPLICATE_REPORT` | 同一日付の日報が既に存在する |
| `DUPLICATE_EMAIL` | メールアドレスが既に使用されている |
| `LAST_VISIT_RECORD` | 最後の訪問記録は削除不可 |
| `CANNOT_DELETE_SELF` | 自分自身のユーザーは削除不可 |

---

*以上*
