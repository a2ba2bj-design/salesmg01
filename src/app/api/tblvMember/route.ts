import { NextRequest } from "next/server";
import { PrismaClient, Prisma } from '../../../../src/generated/prisma/client'
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

// تابع کمکی برای مدیریت خطا
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): { message: string; status: number } {
  console.error('Database error:', error);
  // استفاده از utility های Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code.toString()) {
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
    const FirstName = searchParams.get('FirstName');
    const LastName = searchParams.get('LastName');
    const IsActive = searchParams.get('IsActive');

    let whereCondition: any = {};

  

    if (IsActive !== null && IsActive !== undefined) {
      whereCondition.IsActive = parseInt(IsActive);
    }

    let users;
    if (Object.keys(whereCondition).length === 0) {
      users = await prisma.tblvMember.findMany();
    } else {
      users = await prisma.tblvMember.findMany({
        where: whereCondition,
      });
    }

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
    const FirstName1 = formData.get('FirstName');
    const LastName1 = formData.get('LastName');
    const PersonelID1 = formData.get('PersonelID');
    const FotherName1 = formData.get('FotherName');
    const IsActive1 = formData.get('IsActive');
    const Description1 = formData.get('Description');
    const Temp1 = formData.get('Temp1');
    const Temp2 = formData.get('Temp2');
    const Temp3 = formData.get('Temp3');
    const Temp4 = formData.get('Temp4');

    // اعتبارسنجی فیلدهای اجباری
    if (!FirstName1 || !LastName1) {
      return Response.json(
        { error: "فیلدهای FirstName و LastName اجباری هستند" },
        { status: 400 }
      );
    }

    const firstName = FirstName1.toString().trim();
    const lastName = LastName1.toString().trim();

    // اعتبارسنجی طول فیلدها
    if (firstName.length < 1 || firstName.length > 50) {
      return Response.json(
        { error: "نام باید بین ۱ تا ۵۰ کاراکتر باشد" },
        { status: 400 }
      );
    }

    if (lastName.length < 1 || lastName.length > 50) {
      return Response.json(
        { error: "نام خانوادگی باید بین ۱ تا ۵۰ کاراکتر باشد" },
        { status: 400 }
      );
    }

    // اگر نام کاربری ارائه شده، بررسی تکراری بودن
    if (UserName1) {
      const username = UserName1.toString().trim();
      if (username.length < 3) {
        return Response.json(
          { error: "نام کاربری حداقل ۳ کاراکتر باید باشد" },
          { status: 400 }
        );
      }

      const existingUser = await prisma.tblvMember.findFirst({
        where: { UserName: username }
      });

      if (existingUser) {
        return Response.json(
          { error: "نام کاربری قبلاً ثبت شده است" },
          { status: 409 }
        );
      }
    }

    // اگر رمز عبور ارائه شده، هش کردن
    let hashedPassword = null;
    if (Password1) {
      const password = Password1.toString();
      if (password.length < 6) {
        return Response.json(
          { error: "رمز عبور حداقل ۶ کاراکتر باید باشد" },
          { status: 400 }
        );
      }
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // آماده‌سازی داده‌ها برای ایجاد
    const memberData: any = {
      FirstName: firstName,
      LastName: lastName,
      CreateDate: new Date().toISOString().split('T')[0],
      IsActive: IsActive1 ? parseInt(IsActive1.toString()) : 1
    };

    // اضافه کردن فیلدهای اختیاری اگر وجود دارند
    if (UserName1) {
      memberData.UserName = UserName1.toString().trim();
    }

    if (hashedPassword) {
      memberData.Password = hashedPassword;
    }

    if (PersonelID1) {
      memberData.PersonelID = PersonelID1.toString().trim();
    }

    if (FotherName1) {
      const fotherName = FotherName1.toString().trim();
      if (fotherName.length > 0 && fotherName.length <= 50) {
        memberData.FotherName = fotherName;
      }
    }

    if (Description1) {
      memberData.Description = Description1.toString().trim();
    }

    // اضافه کردن فیلدهای موقت
    const tempFields = ['Temp1', 'Temp2', 'Temp3', 'Temp4'];
    for (const tempField of tempFields) {
      const value = formData.get(tempField);
      if (value) {
        memberData[tempField] = value.toString().trim();
      }
    }

    // ایجاد کاربر جدید
    const newMember = await prisma.tblvMember.create({
      data: memberData
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

// تابع بروزرسانی کاربر (PUT)
export async function PUT(
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

    const formData = await request.formData();
    
    // بررسی وجود کاربر
    const existingMember = await prisma.tblvMember.findUnique({
      where: { MemberID: memberId }
    });

    if (!existingMember) {
      return Response.json(
        { error: "کاربر مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    // آماده‌سازی داده‌ها برای بروزرسانی
    const updateData: any = {};

    // فیلدهای قابل بروزرسانی
    const updatableFields = [
      'UserName', 'Password', 'PersonelID', 'FirstName', 'LastName', 
      'FotherName', 'IsActive', 'Description', 'Temp1', 'Temp2', 'Temp3', 'Temp4'
    ];

    for (const field of updatableFields) {
      const value = formData.get(field);
      if (value !== null && value !== undefined) {
        if (field === 'IsActive') {
          updateData[field] = parseInt(value.toString());
        } else if (field === 'Password') {
          // هش کردن رمز عبور جدید
          const password = value.toString();
          if (password.length >= 6) {
            updateData[field] = await bcrypt.hash(password, 12);
          }
        } else {
          updateData[field] = value.toString().trim();
        }
      }
    }

    // اعتبارسنجی فیلدها
    if (updateData.FirstName && (updateData.FirstName.length < 1 || updateData.FirstName.length > 50)) {
      return Response.json(
        { error: "نام باید بین ۱ تا ۵۰ کاراکتر باشد" },
        { status: 400 }
      );
    }

    if (updateData.LastName && (updateData.LastName.length < 1 || updateData.LastName.length > 50)) {
      return Response.json(
        { error: "نام خانوادگی باید بین ۱ تا ۵۰ کاراکتر باشد" },
        { status: 400 }
      );
    }

    // بررسی تکراری بودن نام کاربری (اگر تغییر کرده)
    if (updateData.UserName && updateData.UserName !== existingMember.UserName) {
      const duplicateUser = await prisma.tblvMember.findFirst({
        where: { 
          UserName: updateData.UserName,
          MemberID: { not: memberId }
        }
      });

      if (duplicateUser) {
        return Response.json(
          { error: "نام کاربری قبلاً ثبت شده است" },
          { status: 409 }
        );
      }
    }

    // بروزرسانی کاربر
    const updatedMember = await prisma.tblvMember.update({
      where: { MemberID: memberId },
      data: updateData
    });

    return Response.json(
      {
        success: true,
        message: "کاربر با موفقیت بروزرسانی شد",
        data: updatedMember
      },
      { status: 200 }
    );

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json(
      { success: false, error: message },
      { status }
    );
  }
}