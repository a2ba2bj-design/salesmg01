import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const posts = await prisma.tblvPost.findMany({
      where: {
        ISActive: 1
      },
      select: {
        PostID: true,
        Name: true,
        NameFull: true
      }
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات پست‌ها' },
      { status: 500 }
    )
  }
}