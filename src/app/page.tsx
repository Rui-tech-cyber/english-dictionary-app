'use client'

import { useState, ChangeEvent } from 'react'

type Word = {
  id: number
  word: string
  meaning: string
  example?: string
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [words, setWords] = useState<Word[]>([])

  const handleSearch = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    const res = await fetch(`/api/words?q=${encodeURIComponent(value)}`)
    const data = await res.json()
    setWords(data)
  }

  return (
    <main>
      <h1>英語辞書</h1>
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="単語または意味で検索"
      />
      <ul>
        {words.map((word) => (
          <li key={word.id}>
            {word.word} - {word.meaning}
            {word.example && <span> ({word.example})</span>}
          </li>
        ))}
      </ul>
    </main>
  )
}
