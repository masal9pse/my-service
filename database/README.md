# Database 設計・マイグレーション運用ガイド

このディレクトリは、Supabase（PostgreSQL）のデータベーススキーマ、マイグレーションファイル、および運用ルールを管理します。

---

## ディレクトリ構成

```text
database/
├── README.md                  # 本ドキュメント（運用ルール・CI自動化手順）
└── migrations/                # 時系列順のマイグレーションSQL
    ├── 001_initial_todos.sql  # 初期 todos テーブル定義
    └── 002_create_goals_and_relations.sql # goals 作成とリレーション
```

---

## 1. 現在の運用ルール（フェーズ1: 手動適用）

1. **ファイル作成**
   * スキーマ変更が必要になったら、`database/migrations/` 配下に連番（例: `003_xxx.sql`）でSQLファイルを作成します。
   * 原則として **`IF NOT EXISTS`** などを使い、冪等性（何回流しても安全な記述）を保ちます。

2. **Supabase への反映**
   * Supabase ダッシュボードの **SQL Editor** に該当ファイルを貼り付けて実行（Run）します。

3. **Git コミット & プルリクエスト**
   * SQLファイルをコミットし、PRでスキーマ変更内容をレビューします。

---

## 2. 将来の運用：CI（GitHub Actions）経由での自動適用（フェーズ2）

Laravel の `php artisan migrate` と同じように、**「`main` ブランチにマージされたら、GitHub Actions が自動で Supabase にマイグレーションを適用する」** 仕組みを構築できます。

### 仕組みの全体像
```text
開発者がPRを作成・マージ
         │
         ▼
GitHub Actions が起動
         │
         ▼
Supabase CLI をインストール
         │
         ▼
supabase link（プロジェクト接続）
         │
         ▼
supabase db push（未適用のマイグレーションを自動実行！＝ php artisan migrate 相当）
```

### ステップ 1: Supabase の接続情報を GitHub Secrets に登録
GitHub リポジトリの **Settings > Secrets and variables > Actions** に以下を登録します。

| Secret 名 | 取得元 | 説明 |
| :--- | :--- | :--- |
| `SUPABASE_ACCESS_TOKEN` | Supabase > Account > Access Tokens | CLI 認証用パーソナルアクセストークン |
| `SUPABASE_PROJECT_ID` | Supabase > Project Settings > General | プロジェクトの Reference ID（8〜20桁の英数字） |
| `SUPABASE_DB_PASSWORD` | プロジェクト作成時に設定したパスワード | PostgreSQL の接続パスワード |

### ステップ 2: Supabase CLI 設定の準備
Supabase CLI はデフォルトで `supabase/migrations` を参照するため、`database/migrations` を参照させるか、シンボリックリンクまたは CLI 設定ファイルを用意します。

最もシンプルな方法は、`supabase/config.toml` を用意するか、GitHub Actions 内でマイグレーションパスを指定する方法です：

### ステップ 3: GitHub Actions ワークフロー例
`.github/workflows/db-migrate.yml` を作成します：

```yaml
name: Deploy Database Migrations

on:
  push:
    branches:
      - main
    paths:
      - 'database/migrations/**'

jobs:
  migrate:
    name: Run Migrations
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to Supabase Project
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      # database/migrations ディレクトリの未適用差分を本番DBへ反映（php artisan migrate 相当）
      - name: Push Database Migrations
        run: |
          supabase db push --include-all --workdir database
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

これで、ローカルやGUIでSQLを実行することなく、**Gitにマイグレーションファイルをプッシュするだけで本番DBが自動更新されるモダンなCI/CDパイプライン**が完成します。
