'use server'
import { PrismaClient } from '@prisma/client'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

export async function authenticateUser(formData: FormData) {
  const username1 = formData.get('UserName')?.toString()
  const password1 = formData.get('Password')?.toString()
  const postname1 = formData.get('NameFull')?.toString()
  const postid1 = formData.get('PostID'?.toString())

  if (!username1 || !password1 ||!postid1) {
    return { 
      success: false, 
      message: 'لطفاً تمام فیلدها را پر کنید' 
    }
  }

  try {
    const user = await prisma.tblvMember.findFirst({
      where: {
        UserName: username1,
        Password: password1, // بهتر است hash شود
        IsActive: 1
      }
    })

    if (!user) {
      return { 
        success: false, 
        message: 'نام کاربری یا رمز عبور اشتباه است' 
      }
    }

    const userPost = await prisma.tblvPost.findFirst({
      where: {
        PostID: postid1,
        NameFull:postname1,
        ISActive: 1
      }
    })

    if (!userPost) {
      return { 
        success: false, 
        message: 'پست انتخابی معتبر نیست' 
      }
    }

    const userSession = {
      memberID: user.MemberID,
      username: user.UserName,
      firstName: user.FirstName,
      lastName: user.LastName,
      postID: userPost.PostID,
      postNamefull: userPost.NameFull
    }

    // در اینجا session باید واقعاً ذخیره شود
    // await saveSession(userSession)
    
    return { 
      success: true, 
      message: 'ورود موفقیت‌آمیز بود',
      user: userSession 
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return { 
      success: false, 
      message: 'خطا در ارتباط با سرور' 
    }
  }
}