import { NextRequest } from "next/server";
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

// تابع کمکی برای مدیریت خطا
function handlePrismaError(error: unknown): { message: string; status: number } {
  console.error('Database error:', error);
  // استفاده از utility های Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return { message: 'رکورد تکراری وجود دارد', status: 409 };
      case 'P2025':
        return { message: 'رکورد مورد نظر یافت نشد', status: 404 };
      case 'P2003':
        return { message: 'خطای ارجاع خارجی', status: 400 };
      default:
        return { message: `خطای پایگاه داده: ${error.code}`, status: 400 };
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return { message: 'خطای ناشناخته پایگاه داده', status: 500 };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return { message: 'خطای سیستمی پایگاه داده', status: 500 };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return { message: 'خطای اتصال به پایگاه داده', status: 500 };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return { message: 'داده‌های ارسالی معتبر نیستند', status: 400 };
  }

  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }

  return { message: 'خطای سرور داخلی', status: 500 };
}
// تابع حذف کاربر
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memberId = parseInt(id);

    if (isNaN(memberId) || memberId <= 0) {
      return Response.json(
        { error: 'شناسه عضو معتبر نیست' },
        { status: 400 }
      );
    }

    await prisma.tblvMember.delete({
      where: { MemberID: memberId }
    });

    return new Response(null, { status: 204 });

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json({ error: message }, { status });
  }
}

// تابع دریافت کاربران
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const UserName1 = searchParams.get('UserName');

    let users;
    if (!UserName1) {
      
      users = await prisma.tblvMember.findMany();
    } else {
      users = await prisma.tblvMember.findMany({
        where: {
          UserName: UserName1.toString()
        },
      });
    }
          
    // اگر makeSerializable نیاز است، از آن استفاده کنید
    // const serializedUsers = makeSerializable(users);

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json({ error: message }, { status });
  }
}

// تابع ایجاد کاربر
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const UserName1 = formData.get('UserName');
    const Password1 = formData.get('Password');

    // اعتبارسنجی فیلدهای اجباری
    if (!UserName1 || !Password1) {
      return Response.json(
        { error: "فیلدهای UserName و Password اجباری هستند" },
        { status: 400 }
      );
    }

    const username = UserName1.toString().trim();
    const password = Password1.toString();

    // اعتبارسنجی طول فیلدها
    if (username.length < 3) {
      return Response.json(
        { error: "نام کاربری حداقل ۳ کاراکتر باید باشد" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: "رمز عبور حداقل ۶ کاراکتر باید باشد" },
        { status: 400 }
      );
    }

    // بررسی وجود کاربر تکراری
    const existingUser = await prisma.tblvMember.findFirst({
      where: { UserName: username }
    });

    if (existingUser) {
      return Response.json(
        { error: "نام کاربری قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    // هش کردن رمز عبور
    const hashedPassword = await bcrypt.hash(password, 12);

    // ایجاد کاربر جدید
    const newMember = await prisma.tblvMember.create({
      data: {
        UserName: username,
        Password: hashedPassword,
        CreateDate: new Date(), // اگر در schema وجود دارد
        IsActive: true // اگر در schema وجود دارد
      }
    });

    // بازگرداندن پاسخ موفق
    return Response.json(
      {
        success: true,
        message: "کاربر با موفقیت ایجاد شد",
        memberId: newMember.MemberID
      },
      { status: 201 }
    );

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json(
      { success: false, error: message },
      { status }
    );
  }
}