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

// تابع حذف FormPostField
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formPostFieldId = parseInt(id);

    if (isNaN(formPostFieldId) || formPostFieldId <= 0) {
      return Response.json(
        { error: 'شناسه FormPostField معتبر نیست' },
        { status: 400 }
      );
    }

    await prisma.tblvFormPostField.delete({
      where: { FormPostFieldID: formPostFieldId }
    });

    return new Response(null, { status: 204 });

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json({ error: message }, { status });
  }
}

// تابع دریافت FormPostField ها
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const formPostId = searchParams.get('FormPostID');
    const creatorMemberId = searchParams.get('CreatorMemberID');
    const isActive = searchParams.get('ISActive');
    const fieldName = searchParams.get('FieldName');

    let whereCondition: Prisma.tblvFormPostFieldWhereInput = {};

    // فیلتر بر اساس FormPostID
    if (formPostId) {
      whereCondition.FormPostID = parseInt(formPostId);
    }

    // فیلتر بر اساس CreatorMemberID
    if (creatorMemberId) {
      whereCondition.CreatorMemberID = parseInt(creatorMemberId);
    }

    // فیلتر بر اساس وضعیت فعال بودن
    if (isActive !== null && isActive !== undefined) {
      whereCondition.ISActive = parseInt(isActive);
    }

    // فیلتر بر اساس نام فیلد
    if (fieldName) {
      whereCondition.FieldName = {
        contains: fieldName,
        mode: 'insensitive' as Prisma.QueryMode
      };
    }

    const formPostFields = await prisma.tblvFormPostField.findMany({
      where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
      orderBy: { FormPostFieldID: 'desc' },
      include: {
        tblvFormPost: {
          include: {
            tblvForm: {
              select: {
                FormNameEN: true,
                FormNameFA: true
              }
            },
            tblvPost: {
              select: {
                PostNameEN: true,
                PostNameFA: true
              }
            }
          }
        },
        tblvMember: {
          select: {
            UserName: true,
            MemberID: true
          }
        }
      }
    });

    return new Response(JSON.stringify(formPostFields), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json({ error: message }, { status });
  }
}

// تابع ایجاد FormPostField جدید
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // دریافت فیلدهای اجباری
    const formPostId = formData.get('FormPostID');
    const fieldName = formData.get('FieldName');
    const visible = formData.get('Visible');
    const enable = formData.get('Enable');
    const readOnly = formData.get('ReadOnly');
    const creatorMemberId = formData.get('CreatorMemberID');
    const createDate = formData.get('CreateDate');

    // اعتبارسنجی فیلدهای اجباری
    if (!formPostId || !fieldName || !visible || !enable || !readOnly || !creatorMemberId || !createDate) {
      return Response.json(
        { error: "فیلدهای FormPostID, FieldName, Visible, Enable, ReadOnly, CreatorMemberID و CreateDate اجباری هستند" },
        { status: 400 }
      );
    }

    const formPostIdValue = parseInt(formPostId.toString());
    const creatorMemberIdValue = parseInt(creatorMemberId.toString());
    const fieldNameValue = fieldName.toString().trim();
    const createDateValue = createDate.toString().trim();

    // اعتبارسنجی مقادیر عددی
    if (isNaN(formPostIdValue) || formPostIdValue <= 0) {
      return Response.json(
        { error: "FormPostID باید یک عدد معتبر باشد" },
        { status: 400 }
      );
    }

    if (isNaN(creatorMemberIdValue) || creatorMemberIdValue <= 0) {
      return Response.json(
        { error: "CreatorMemberID باید یک عدد معتبر باشد" },
        { status: 400 }
      );
    }

    // اعتبارسنجی طول فیلدها
    if (fieldNameValue.length < 1 || fieldNameValue.length > 300) {
      return Response.json(
        { error: "نام فیلد باید بین ۱ تا ۳۰۰ کاراکتر باشد" },
        { status: 400 }
      );
    }

    // بررسی وجود FormPost و Member
    const formPostExists = await prisma.tblvFormPost.findUnique({
      where: { FormPostID: formPostIdValue }
    });

    if (!formPostExists) {
      return Response.json(
        { error: "FormPost مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    const memberExists = await prisma.tblvMember.findUnique({
      where: { MemberID: creatorMemberIdValue }
    });

    if (!memberExists) {
      return Response.json(
        { error: "کاربر ایجاد کننده یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی وجود رکورد تکراری (همان فیلد در همان FormPost)
    const existingFormPostField = await prisma.tblvFormPostField.findFirst({
      where: { 
        FormPostID: formPostIdValue,
        FieldName: fieldNameValue
      }
    });

    if (existingFormPostField) {
      return Response.json(
        { error: "این فیلد قبلاً برای این FormPost ثبت شده است" },
        { status: 409 }
      );
    }

    // دریافت فیلدهای اختیاری
    const isActive = formData.get('ISActive');
    const description = formData.get('Discription');
    const temp1 = formData.get('Temp1');
    const temp2 = formData.get('Temp2');

    // آماده‌سازی داده‌ها برای ایجاد
    const formPostFieldDataToCreate = {
      FormPostID: formPostIdValue,
      FieldName: fieldNameValue,
      Visible: visible.toString().toLowerCase() === 'true',
      Enable: enable.toString().toLowerCase() === 'true',
      ReadOnly: readOnly.toString().toLowerCase() === 'true',
      CreatorMemberID: creatorMemberIdValue,
      CreateDate: createDateValue,
      ISActive: isActive ? parseInt(isActive.toString()) : 1, // پیش‌فرض فعال
      Discription: description ? description.toString().trim() : null,
      Temp1: temp1 ? temp1.toString().trim() : null,
      Temp2: temp2 ? temp2.toString().trim() : null
    };

    // ایجاد FormPostField جدید
    const newFormPostField = await prisma.tblvFormPostField.create({
      data: formPostFieldDataToCreate,
      include: {
        tblvFormPost: {
          include: {
            tblvForm: {
              select: {
                FormNameEN: true,
                FormNameFA: true
              }
            },
            tblvPost: {
              select: {
                PostNameEN: true,
                PostNameFA: true
              }
            }
          }
        },
        tblvMember: {
          select: {
            UserName: true
          }
        }
      }
    });

    // بازگرداندن پاسخ موفق
    return Response.json(
      {
        success: true,
        message: "فیلد FormPost با موفقیت ایجاد شد",
        formPostFieldId: newFormPostField.FormPostFieldID,
        data: newFormPostField
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

// تابع بروزرسانی FormPostField (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formPostFieldId = parseInt(id);

    if (isNaN(formPostFieldId) || formPostFieldId <= 0) {
      return Response.json(
        { error: 'شناسه FormPostField معتبر نیست' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    // بررسی وجود FormPostField
    const existingFormPostField = await prisma.tblvFormPostField.findUnique({
      where: { FormPostFieldID: formPostFieldId }
    });

    if (!existingFormPostField) {
      return Response.json(
        { error: "فیلد FormPost مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    // آماده‌سازی داده‌ها برای بروزرسانی
    const updateData: Prisma.tblvFormPostFieldUpdateInput = {};

    // فیلدهای قابل بروزرسانی
    const updatableFields = [
      'FieldName', 'Visible', 'Enable', 'ReadOnly', 'ISActive', 
      'Discription', 'Temp1', 'Temp2'
    ];

    for (const field of updatableFields) {
      const value = formData.get(field);
      if (value !== null && value !== undefined) {
        if (field === 'ISActive') {
          updateData[field] = parseInt(value.toString());
        } else if (field === 'Visible' || field === 'Enable' || field === 'ReadOnly') {
          updateData[field] = value.toString().toLowerCase() === 'true';
        } else if (field === 'FieldName') {
          const fieldNameValue = value.toString().trim();
          if (fieldNameValue.length < 1 || fieldNameValue.length > 300) {
            return Response.json(
              { error: "نام فیلد باید بین ۱ تا ۳۰۰ کاراکتر باشد" },
              { status: 400 }
            );
          }
          updateData[field] = fieldNameValue;
        } else {
          updateData[field] = value.toString().trim();
        }
      }
    }

    // اگر FormPostID یا FieldName تغییر کرده، بررسی تکراری بودن
    const newFormPostId = formData.get('FormPostID');
    const newFieldName = formData.get('FieldName');

    if (newFormPostId || newFieldName) {
      const checkFormPostId = newFormPostId ? parseInt(newFormPostId.toString()) : existingFormPostField.FormPostID;
      const checkFieldName = newFieldName ? newFieldName.toString().trim() : existingFormPostField.FieldName;

      if (checkFormPostId !== existingFormPostField.FormPostID || checkFieldName !== existingFormPostField.FieldName) {
        const duplicateFormPostField = await prisma.tblvFormPostField.findFirst({
          where: { 
            FormPostID: checkFormPostId,
            FieldName: checkFieldName,
            FormPostFieldID: { not: formPostFieldId }
          }
        });

        if (duplicateFormPostField) {
          return Response.json(
            { error: "این فیلد قبلاً برای این FormPost ثبت شده است" },
            { status: 409 }
          );
        }
      }

      // اضافه کردن FormPostID به داده‌های بروزرسانی اگر ارسال شده
      if (newFormPostId) {
        const formPostIdValue = parseInt(newFormPostId.toString());
        
        // بررسی وجود FormPost جدید
        const formPostExists = await prisma.tblvFormPost.findUnique({
          where: { FormPostID: formPostIdValue }
        });

        if (!formPostExists) {
          return Response.json(
            { error: "FormPost مورد نظر یافت نشد" },
            { status: 404 }
          );
        }

        updateData.FormPostID = formPostIdValue;
        updateData.tblvFormPost = { connect: { FormPostID: formPostIdValue } };
      }
    }

    // بروزرسانی FormPostField
    const updatedFormPostField = await prisma.tblvFormPostField.update({
      where: { FormPostFieldID: formPostFieldId },
      data: updateData,
      include: {
        tblvFormPost: {
          include: {
            tblvForm: {
              select: {
                FormNameEN: true,
                FormNameFA: true
              }
            },
            tblvPost: {
              select: {
                PostNameEN: true,
                PostNameFA: true
              }
            }
          }
        },
        tblvMember: {
          select: {
            UserName: true
          }
        }
      }
    });

    return Response.json(
      {
        success: true,
        message: "فیلد FormPost با موفقیت بروزرسانی شد",
        data: updatedFormPostField
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