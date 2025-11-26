import { NextRequest } from "next/server";
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// تابع کمکی برای مدیریت خطا
function handlePrismaError(error: unknown): { message: string; status: number } {
  console.error('Database error:', error);
  
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

// تابع حذف فرم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formId = parseInt(id);

    if (isNaN(formId) || formId <= 0) {
      return Response.json(
        { error: 'شناسه فرم معتبر نیست' },
        { status: 400 }
      );
    }

    await prisma.tblvForm.delete({
      where: { FormID: formId }
    });

    return new Response(null, { status: 204 });

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json({ error: message }, { status });
  }
}

// تابع دریافت فرم‌ها
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const formNameEN = searchParams.get('FormNameEN');
    const formNameFA = searchParams.get('FormNameFA');
    const isActive = searchParams.get('IsActive');
    const workstationId = searchParams.get('WorkStationID');

    let whereCondition: any = {};

    // فیلتر بر اساس نام انگلیسی فرم
    if (formNameEN) {
      whereCondition.FormNameEN = {
        contains: formNameEN.toString(),
        mode: 'insensitive' as Prisma.QueryMode
      };
    }

    // فیلتر بر اساس نام فارسی فرم
    if (formNameFA) {
      whereCondition.FormNameFA = {
        contains: formNameFA.toString(),
        mode: 'insensitive' as Prisma.QueryMode
      };
    }

    // فیلتر بر اساس وضعیت فعال بودن
    if (isActive !== null && isActive !== undefined) {
      whereCondition.IsActive = parseInt(isActive);
    }

    // فیلتر بر اساس WorkStationID
    if (workstationId) {
      whereCondition.WorkStationID = parseInt(workstationId);
    }

    const forms = await prisma.tblvForm.findMany({
      where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
      orderBy: { FormID: 'desc' },
      include: {
        tblvFormPost: {
          include: {
            tblvPost: true
          }
        }
      }
    });

    return new Response(JSON.stringify(forms), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json({ error: message }, { status });
  }
}

// تابع ایجاد فرم جدید
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // دریافت فیلدهای اجباری
    const formNameEN = formData.get('FormNameEN');
    const formNameFA = formData.get('FormNameFA');

    // اعتبارسنجی فیلدهای اجباری
    if (!formNameEN || !formNameFA) {
      return Response.json(
        { error: "فیلدهای FormNameEN و FormNameFA اجباری هستند" },
        { status: 400 }
      );
    }

    const formNameENValue = formNameEN.toString().trim();
    const formNameFAValue = formNameFA.toString().trim();

    // اعتبارسنجی طول فیلدها
    if (formNameENValue.length < 2 || formNameENValue.length > 50) {
      return Response.json(
        { error: "نام انگلیسی فرم باید بین ۲ تا ۵۰ کاراکتر باشد" },
        { status: 400 }
      );
    }

    if (formNameFAValue.length < 2 || formNameFAValue.length > 50) {
      return Response.json(
        { error: "نام فارسی فرم باید بین ۲ تا ۵۰ کاراکتر باشد" },
        { status: 400 }
      );
    }

    // بررسی وجود فرم تکراری (بر اساس نام انگلیسی)
    const existingForm = await prisma.tblvForm.findFirst({
      where: { 
        FormNameEN: formNameENValue 
      }
    });

    if (existingForm) {
      return Response.json(
        { error: "فرم با این نام انگلیسی قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    // دریافت فیلدهای اختیاری
    const workstationID = formData.get('WorkStationID');
    const requestString = formData.get('RequestString');
    const description = formData.get('Description');
    const temp1 = formData.get('Temp1');
    const isActive = formData.get('IsActive');

    // آماده‌سازی داده‌ها برای ایجاد
    const formDataToCreate: any = {
      FormNameEN: formNameENValue,
      FormNameFA: formNameFAValue,
      CreateDate: new Date(),
      IsActive: isActive ? parseInt(isActive.toString()) : 1 // پیش‌فرض فعال
    };

    // اضافه کردن فیلدهای اختیاری اگر وجود دارند
    if (workstationID) {
      formDataToCreate.WorkStationID = parseInt(workstationID.toString());
    }

    if (requestString) {
      formDataToCreate.RequestString = requestString.toString().trim();
    }

    if (description) {
      formDataToCreate.Description = description.toString().trim();
    }

    if (temp1) {
      formDataToCreate.Temp1 = temp1.toString().trim();
    }

    // ایجاد فرم جدید
    const newForm = await prisma.tblvForm.create({
      data: formDataToCreate
    });

    // بازگرداندن پاسخ موفق
    return Response.json(
      {
        success: true,
        message: "فرم با موفقیت ایجاد شد",
        formId: newForm.FormID,
        data: newForm
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

// تابع بروزرسانی فرم (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formId = parseInt(id);

    if (isNaN(formId) || formId <= 0) {
      return Response.json(
        { error: 'شناسه فرم معتبر نیست' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    // بررسی وجود فرم
    const existingForm = await prisma.tblvForm.findUnique({
      where: { FormID: formId }
    });

    if (!existingForm) {
      return Response.json(
        { error: "فرم مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    // آماده‌سازی داده‌ها برای بروزرسانی
    const updateData: any = {};

    // فیلدهای قابل بروزرسانی
    const updatableFields = [
      'WorkStationID', 'FormNameEN', 'FormNameFA', 'RequestString', 
      'IsActive', 'Description', 'Temp1'
    ];

    for (const field of updatableFields) {
      const value = formData.get(field);
      if (value !== null && value !== undefined) {
        if (field === 'WorkStationID' || field === 'IsActive') {
          updateData[field] = parseInt(value.toString());
        } else {
          updateData[field] = value.toString().trim();
        }
      }
    }

    // اعتبارسنجی فیلدهای اجباری اگر ارسال شده‌اند
    if (updateData.FormNameEN && (updateData.FormNameEN.length < 2 || updateData.FormNameEN.length > 50)) {
      return Response.json(
        { error: "نام انگلیسی فرم باید بین ۲ تا ۵۰ کاراکتر باشد" },
        { status: 400 }
      );
    }

    if (updateData.FormNameFA && (updateData.FormNameFA.length < 2 || updateData.FormNameFA.length > 50)) {
      return Response.json(
        { error: "نام فارسی فرم باید بین ۲ تا ۵۰ کاراکتر باشد" },
        { status: 400 }
      );
    }

    // بررسی تکراری نبودن نام انگلیسی (اگر تغییر کرده)
    if (updateData.FormNameEN && updateData.FormNameEN !== existingForm.FormNameEN) {
      const duplicateForm = await prisma.tblvForm.findFirst({
        where: { 
          FormNameEN: updateData.FormNameEN,
          FormID: { not: formId }
        }
      });

      if (duplicateForm) {
        return Response.json(
          { error: "فرم با این نام انگلیسی قبلاً ثبت شده است" },
          { status: 409 }
        );
      }
    }

    // بروزرسانی فرم
    const updatedForm = await prisma.tblvForm.update({
      where: { FormID: formId },
      data: updateData
    });

    return Response.json(
      {
        success: true,
        message: "فرم با موفقیت بروزرسانی شد",
        data: updatedForm
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