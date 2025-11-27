'use server'
import { PrismaClient } from '@prisma/client'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

export async function authenticateUser(formData: FormData) {
  const username = formData.get('username')?.toString()
  const password = formData.get('password')?.toString()
  const post = formData.get('post')?.toString()

  if (!username || !password || !post) {
    return { 
      success: false, 
      message: 'لطفاً تمام فیلدها را پر کنید' 
    }
  }

  try {
    // بررسی کاربر در tblvMember
    const user = await prisma.tblvMember.findFirst({
      where: {
        UserName: username,
        Password: password,
        IsActive: 1 // فقط کاربران فعال
      }
    })

    if (!user) {
      return { 
        success: false, 
        message: 'نام کاربری یا رمز عبور اشتباه است' 
      }
    }

    // بررسی پست در tblvPost
    const userPost = await prisma.tblvPost.findFirst({
      where: {
        PostID: parseInt(post),
        ISActive: 1 // فقط پست‌های فعال
      }
    })

    if (!userPost) {
      return { 
        success: false, 
        message: 'پست انتخابی معتبر نیست' 
      }
    }

    // ذخیره اطلاعات کاربر در session (می‌توانید از auth.js استفاده کنید)
    const userSession = {
      memberID: user.MemberID,
      username: user.UserName,
      firstName: user.FirstName,
      lastName: user.LastName,
      postID: userPost.PostID,
      postName: userPost.Name
    }

    // در اینجا می‌توانید session یا token ایجاد کنید
    console.log('User authenticated:', userSession)

    // هدایت به صفحه پیش‌فرض
    redirect('/dashboard')

  } catch (error) {
    console.error('Authentication error:', error)
    return { 
      success: false, 
      message: 'خطا در ارتباط با سرور' 
    }
  }
}