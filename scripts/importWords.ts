import fs from 'fs'
import { parse } from 'csv-parse/sync'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type WordCSV = {
  word: string
  meaning: string
  example?: string
}

async function main() {
  const file = fs.readFileSync('words.csv')

  const records = parse(file, {
    columns: true,
    skip_empty_lines: true,
  }) as WordCSV[] // 👈 型を明示

  for (const record of records) {
    await prisma.word.create({
      data: {
        word: record.word,
        meaning: record.meaning,
        example: record.example,
      },
    })
  }

  console.log('✅ Import completed')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())