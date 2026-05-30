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

## 10. 検索機能実装

### API拡張

#### URL例

```text
/api/words?q=apple
```

---

### 検索ロジック

```ts
const query = searchParams.get('q') || ''
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

## 11. フロント側検索UI

### 状態管理

```ts
const [query, setQuery] = useState('')
const [words, setWords] = useState([])
```

---

### API呼び出し

```ts
const res = await fetch(`/api/words?q=${query}`)
```

---

### 検索結果表示

```tsx
{words.map((word) => (
  <li key={word.id}>
    {word.word}
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

## 検索APIのレスポンスエラー

発生内容

```text
Unexpected end of JSON input
```

原因

* APIが正常なJSONを返却していない

今後調査予定。

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
* 検索機能（実装中）

---

# 今後の実装予定

優先度高

1. 検索機能不具合修正
2. 単語詳細ページ
3. 単語登録機能
4. お気に入り機能
5. 登録単語帳

優先度中

6. 単語テスト機能
7. 学習履歴
8. ユーザー管理

優先度低

9. 音声再生
10. AI例文生成
11. 学習分析機能
