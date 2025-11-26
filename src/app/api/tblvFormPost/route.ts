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

// تابع حذف FormPost
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formPostId = parseInt(id);

    if (isNaN(formPostId) || formPostId <= 0) {
      return Response.json(
        { error: 'شناسه FormPost معتبر نیست' },
        { status: 400 }
      );
    }

    await prisma.tblvFormPost.delete({
      where: { FormPostID: formPostId }
    });

    return new Response(null, { status: 204 });

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json({ error: message }, { status });
  }
}

// تابع دریافت FormPost ها
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const formId = searchParams.get('FormID');
    const postId = searchParams.get('PostID');
    const isActive = searchParams.get('IsActive');

    let whereCondition: any = {};

    // فیلتر بر اساس FormID
    if (formId) {
      whereCondition.FormID = parseInt(formId);
    }

    // فیلتر بر اساس PostID
    if (postId) {
      whereCondition.PostID = parseInt(postId);
    }

    // فیلتر بر اساس وضعیت فعال بودن
    if (isActive !== null && isActive !== undefined) {
      whereCondition.IsActive = parseInt(isActive);
    }

    const formPosts = await prisma.tblvFormPost.findMany({
      where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
      orderBy: { FormPostID: 'desc' },
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
        },
        tblvFormPostField: true
      }
    });

    return new Response(JSON.stringify(formPosts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json({ error: message }, { status });
  }
}

// تابع ایجاد FormPost جدید
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // دریافت فیلدهای اجباری
    const formId = formData.get('FormID');
    const postId = formData.get('PostID');

    // اعتبارسنجی فیلدهای اجباری
    if (!formId || !postId) {
      return Response.json(
        { error: "فیلدهای FormID و PostID اجباری هستند" },
        { status: 400 }
      );
    }

    const formIdValue = parseInt(formId.toString());
    const postIdValue = parseInt(postId.toString());

    // اعتبارسنجی مقادیر عددی
    if (isNaN(formIdValue) || formIdValue <= 0) {
      return Response.json(
        { error: "FormID باید یک عدد معتبر باشد" },
        { status: 400 }
      );
    }

    if (isNaN(postIdValue) || postIdValue <= 0) {
      return Response.json(
        { error: "PostID باید یک عدد معتبر باشد" },
        { status: 400 }
      );
    }

    // بررسی وجود Form و Post
    const formExists = await prisma.tblvForm.findUnique({
      where: { FormID: formIdValue }
    });

    if (!formExists) {
      return Response.json(
        { error: "فرم مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    const postExists = await prisma.tblvPost.findUnique({
      where: { PostID: postIdValue }
    });

    if (!postExists) {
      return Response.json(
        { error: "پست مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی وجود رکورد تکراری
    const existingFormPost = await prisma.tblvFormPost.findFirst({
      where: { 
        FormID: formIdValue,
        PostID: postIdValue
      }
    });

    if (existingFormPost) {
      return Response.json(
        { error: "این ارتباط فرم و پست قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    // دریافت فیلدهای اختیاری
    const isActive = formData.get('IsActive');
    const crudc = formData.get('CRUDc');
    const crudr = formData.get('CRUDr');
    const crudu = formData.get('CRUDu');
    const crudd = formData.get('CRUDd');
    const crudConfirm = formData.get('CRUDConfirm');
    const crudApprove = formData.get('CRUDApprove');
    const temp1 = formData.get('temp1');
    const temp2 = formData.get('temp2');
    const temp3 = formData.get('temp3');
    const temp4 = formData.get('temp4');

    // آماده‌سازی داده‌ها برای ایجاد
    const formPostDataToCreate: any = {
      FormID: formIdValue,
      PostID: postIdValue,
      IsActive: isActive ? parseInt(isActive.toString()) : 1 // پیش‌فرض فعال
    };

    // اضافه کردن فیلدهای CRUD اگر وجود دارند
    if (crudc !== null && crudc !== undefined) {
      formPostDataToCreate.CRUDc = crudc.toString().toLowerCase() === 'true';
    }

    if (crudr !== null && crudr !== undefined) {
      formPostDataToCreate.CRUDr = crudr.toString().toLowerCase() === 'true';
    }

    if (crudu !== null && crudu !== undefined) {
      formPostDataToCreate.CRUDu = crudu.toString().toLowerCase() === 'true';
    }

    if (crudd !== null && crudd !== undefined) {
      formPostDataToCreate.CRUDd = crudd.toString().toLowerCase() === 'true';
    }

    if (crudConfirm !== null && crudConfirm !== undefined) {
      formPostDataToCreate.CRUDConfirm = crudConfirm.toString().toLowerCase() === 'true';
    }

    if (crudApprove !== null && crudApprove !== undefined) {
      formPostDataToCreate.CRUDApprove = crudApprove.toString().toLowerCase() === 'true';
    }

    // اضافه کردن فیلدهای temp اگر وجود دارند
    if (temp1) {
      formPostDataToCreate.temp1 = temp1.toString().trim();
    }

    if (temp2) {
      formPostDataToCreate.temp2 = temp2.toString().trim();
    }

    if (temp3) {
      formPostDataToCreate.temp3 = temp3.toString().trim();
    }

    if (temp4) {
      formPostDataToCreate.temp4 = temp4.toString().trim();
    }

    // ایجاد FormPost جدید
    const newFormPost = await prisma.tblvFormPost.create({
      data: formPostDataToCreate,
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
    });

    // بازگرداندن پاسخ موفق
    return Response.json(
      {
        success: true,
        message: "ارتباط فرم و پست با موفقیت ایجاد شد",
        formPostId: newFormPost.FormPostID,
        data: newFormPost
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

// تابع بروزرسانی FormPost (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formPostId = parseInt(id);

    if (isNaN(formPostId) || formPostId <= 0) {
      return Response.json(
        { error: 'شناسه FormPost معتبر نیست' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    // بررسی وجود FormPost
    const existingFormPost = await prisma.tblvFormPost.findUnique({
      where: { FormPostID: formPostId }
    });

    if (!existingFormPost) {
      return Response.json(
        { error: "ارتباط فرم و پست مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    // آماده‌سازی داده‌ها برای بروزرسانی
    const updateData: any = {};

    // فیلدهای قابل بروزرسانی
    const updatableFields = [
      'IsActive', 'CRUDc', 'CRUDr', 'CRUDu', 'CRUDd', 
      'CRUDConfirm', 'CRUDApprove', 'temp1', 'temp2', 'temp3', 'temp4'
    ];

    for (const field of updatableFields) {
      const value = formData.get(field);
      if (value !== null && value !== undefined) {
        if (field === 'IsActive') {
          updateData[field] = parseInt(value.toString());
        } else if (field.startsWith('CRUD')) {
          updateData[field] = value.toString().toLowerCase() === 'true';
        } else {
          updateData[field] = value.toString().trim();
        }
      }
    }

    // اگر FormID یا PostID ارسال شده، بررسی تکراری بودن
    const newFormId = formData.get('FormID');
    const newPostId = formData.get('PostID');

    if (newFormId || newPostId) {
      const checkFormId = newFormId ? parseInt(newFormId.toString()) : existingFormPost.FormID;
      const checkPostId = newPostId ? parseInt(newPostId.toString()) : existingFormPost.PostID;

      if (checkFormId !== existingFormPost.FormID || checkPostId !== existingFormPost.PostID) {
        const duplicateFormPost = await prisma.tblvFormPost.findFirst({
          where: { 
            FormID: checkFormId,
            PostID: checkPostId,
            FormPostID: { not: formPostId }
          }
        });

        if (duplicateFormPost) {
          return Response.json(
            { error: "این ارتباط فرم و پست قبلاً ثبت شده است" },
            { status: 409 }
          );
        }
      }

      // اضافه کردن FormID و PostID به داده‌های بروزرسانی اگر ارسال شده‌اند
      if (newFormId) {
        updateData.FormID = parseInt(newFormId.toString());
      }
      if (newPostId) {
        updateData.PostID = parseInt(newPostId.toString());
      }
    }

    // بروزرسانی FormPost
    const updatedFormPost = await prisma.tblvFormPost.update({
      where: { FormPostID: formPostId },
      data: updateData,
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
    });

    return Response.json(
      {
        success: true,
        message: "ارتباط فرم و پست با موفقیت بروزرسانی شد",
        data: updatedFormPost
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