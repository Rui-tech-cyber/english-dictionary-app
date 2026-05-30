import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') || ''

  const words = await prisma.word.findMany({
    where: query
      ? {
          OR: [
            { word: { contains: query } },
            { meaning: { contains: query } },
          ],
        }
      : undefined,
  })

  return NextResponse.json(words)
}