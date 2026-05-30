# 英語辞書アプリ 開発概要

## プロジェクト概要

英語学習者向けのWeb辞書アプリを開発する。

単語検索機能を中心とし、将来的には以下の機能を実装予定。

- 単語検索
- 単語詳細表示
- 登録単語帳
- 単語テスト（Exam）
- ユーザー管理
- 学習履歴管理

現在はMVP（最小実装版）として、辞書検索機能の基盤構築を進めている。

---

# 技術構成

## フロントエンド

- Next.js 14
- React
- TypeScript
- App Router

## バックエンド

- Next.js Route Handler

## データベース

- SQLite

## ORM

- Prisma 5

## バージョン管理

- Git
- GitHub

---

# 実装内容

## 1. Next.jsプロジェクト作成

### 作成コマンド

```bash
npx create-next-app@14.2.5 english-dictionary-app
```

### 選択内容

```text
TypeScript: Yes
ESLint: Yes
Tailwind CSS: Yes
src Directory: Yes
App Router: Yes
```

### 目的

* TypeScript対応
* App Router利用
* 今後の拡張性確保

---

## 2. Git管理開始

### Git初期化

```bash
git init
```

### 初回コミット

```bash
git add .
git commit -m "initial commit"
```

### GitHub連携

```bash
git remote add origin <repository-url>
git branch -M main
git push -u origin main
```

### 目的

* ソースコード管理
* バックアップ
* 変更履歴管理

---

## 3. Prisma導入

### インストール

```bash
npm install prisma@5 @prisma/client@5
```

### 初期化

```bash
npx prisma init
```

生成ファイル

```text
prisma/schema.prisma
.env
```

---

## 4. SQLite設定

### .env

```env
DATABASE_URL="file:./dev.db"
```

### 採用理由

* ローカル開発が容易
* DBサーバー不要
* セットアップが簡単

---

## 5. Wordモデル作成

### schema.prisma

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Word {
  id        Int      @id @default(autoincrement())
  word      String
  meaning   String
  example   String?
  createdAt DateTime @default(now())
}
```

### カラム説明

| カラム名      | 型        | 説明   |
| --------- | -------- | ---- |
| id        | Int      | 主キー  |
| word      | String   | 英単語  |
| meaning   | String   | 日本語訳 |
| example   | String   | 例文   |
| createdAt | DateTime | 登録日時 |

---

## 6. マイグレーション実行

### コマンド

```bash
npx prisma migrate dev --name init
```

### 実施内容

* SQLite DB作成
* Wordテーブル生成
* Prisma Client生成

---

## 7. Prisma Client共通化

### 作成ファイル

```text
src/lib/prisma.ts
```

### 実装

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as any

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### 目的

* PrismaClientの多重生成防止
* 開発時のホットリロード対策

---

## 8. 単語取得API作成

### 作成ファイル

```text
src/app/api/words/route.ts
```

### 実装内容

```ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const words = await prisma.word.findMany()

  return NextResponse.json(words)
}
```

### 役割

* DBから単語取得
* JSON形式で返却

---

## 9. CSVインポート機能

### 目的

単語データを一括登録するため。

---

### CSVファイル作成

```csv
word,meaning,example
apple,りんご,I eat an apple.
run,走る,I run every morning.
book,本,This book is interesting.
```

---

### ライブラリ導入

```bash
npm install csv-parse
npm install ts-node
```

---

### 作成ファイル

```text
scripts/importWords.ts
```

---

### 実装概要

#### CSV読込

```ts
fs.readFileSync('words.csv')
```

#### CSV解析

```ts
parse(file, {
  columns: true,
  skip_empty_lines: true
})
```

#### DB登録

```ts
await prisma.word.create({
  data: {
    word: record.word,
    meaning: record.meaning,
    example: record.example
  }
})
```

---

### 実行

```bash
npx ts-node scripts/importWords.ts
```

---

### 型定義対応

```ts
type WordCSV = {
  word: string
  meaning: string
  example?: string
}
```

#### 理由

csv-parseの戻り値がunknown型になるため。

---

## 10. layout.tsx 日本語化・Font設定変更

### 変更内容

* `Inter` フォント（Google Fonts）を削除
* `<html lang="en">` → `<html lang="ja">` に変更
* メタデータを日本語アプリ向けに更新

```tsx
export const metadata: Metadata = {
  title: "英語辞書",
  description: "英語学習者向けWeb辞書アプリ",
};
```

### 変更理由

* フォント読み込みによる起動・描画のオーバーヘッド削減
* 日本語ユーザー向けに `lang` 属性を適切に設定

---

## 11. 検索機能実装（API拡張）

### API拡張

#### URL例

```text
/api/words?q=apple
```

---

### 検索ロジック

```ts
const query = request.nextUrl.searchParams.get('q') || ''
```

```ts
where: {
  OR: [
    {
      word: {
        contains: query
      }
    },
    {
      meaning: {
        contains: query
      }
    }
  ]
}
```

---

### 検索対象

* 英単語
* 日本語訳

---

### 検索方式

部分一致検索

例

```text
app
↓
apple
```

---

## 12. フロント側検索UI

### 状態管理

```ts
const [query, setQuery] = useState('')
const [words, setWords] = useState([])
```

---

### API呼び出し

```ts
const res = await fetch(`/api/words?q=${encodeURIComponent(value)}`)
```

---

### 検索結果表示

```tsx
{words.map((word) => (
  <li key={word.id}>
    {word.word} - {word.meaning}
    {word.example && <span> ({word.example})</span>}
  </li>
))}
```

---

# 発生した課題

## Prisma v7との互換性問題

発生内容

* datasource.url 廃止
* prisma.config.ts方式へ変更

対応

* Prisma 5へダウングレード
* 安定版構成へ変更

---

## Next.jsバージョン差異

発生内容

* App Router構成の違い
* ESLint依存エラー

対応

```bash
npx create-next-app@14.2.5
```

へ変更。

---

## CSV取込時の型エラー

発生内容

```text
record is of type unknown
```

対応

```ts
type WordCSV
```

を作成し型付け対応。

---

## layout.tsx コンパイルエラー（globals.css 型宣言不足）

発生内容

```text
Cannot find module or type declarations for side-effect import of './globals.css'.
```

原因

* TypeScript が CSS ファイルのサイドエフェクトインポートに対して型宣言を要求（TS2882）

対応

* `src/global.d.ts` を作成し `declare module '*.css' {}` を追加
* 解決済み

---

## micromatch パッケージ破損

発生内容

```text
Cannot find module '/...node_modules/micromatch/index.js'
```

原因

* `node_modules/micromatch/` に `package.json` のみ残り `index.js` が欠落
* `next/font` → `fast-glob` → `micromatch` の依存チェーンで起動時エラー

対応

* `node_modules/micromatch/` を削除後 `npm install` を再実行
* `index.js` が復元され解決済み

対応

* `node_modules/micromatch/` を削除後 `npm install` を再実行
* `index.js` が復元され解決済み
* `npm run dev` 起動確認済み（Ready in 4.2s）

---

## iCloud Drive配下によるnode_modules同期問題

発生内容

* `npm run dev` の起動に非常に長い時間がかかる

原因

* プロジェクトが iCloud Drive 配下（`~/Library/Mobile Documents/com~apple~CloudDocs/`）に置かれていた
* iCloud の自動同期が `node_modules` 以下の数万ファイルを対象とし、ファイルI/Oが著しく低下

対応

* プロジェクトを iCloud Drive 外の `/Users/nakamura/Projects/english-dictionary-app` へ移動
* 移動後の起動時間を計測し、`Ready in 4.2s` を確認
* 解決済み

---

## 検索APIのレスポンスエラー

発生内容

```text
Unexpected end of JSON input
```

原因

* APIが正常なJSONを返却していない

対応

* `NextRequest` を使用した実装に修正
* フロント側で `encodeURIComponent` を使用するよう修正
* 解決済み

---

# 現在の到達点

実装済み

* Next.js環境構築
* GitHub管理
* Prisma導入
* SQLite導入
* Wordモデル作成
* API作成
* CSVインポート機能
* 検索機能（部分一致・日本語対応）
* layout.tsx 日本語化・Font設定変更

動作確認済み

* `npm run dev` 起動確認（Ready in 4.2s）
* HTTP 200 レスポンス確認済み
* プロジェクトをiCloud Drive外へ移動し、起動速度問題を解消

---

# 今後の実装予定

優先度高

1. 単語詳細ページ
2. 単語登録機能
3. お気に入り機能
4. 登録単語帳

優先度中

6. 単語テスト機能
7. 学習履歴
8. ユーザー管理

優先度低

9. 音声再生
10. AI例文生成
11. 学習分析機能
