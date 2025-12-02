import { NextRequest } from "next/server";
import { PrismaClient, Prisma } from '../../../../src/generated/prisma/client'
const prisma = new PrismaClient();

// تابع کمکی برای مدیریت خطا
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): { message: string; status: number } {
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

// تابع حذف پست
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId) || postId <= 0) {
      return Response.json(
        { error: 'شناسه پست معتبر نیست' },
        { status: 400 }
      );
    }

    await prisma.tblvPost.delete({
      where: { PostID: postId }
    });

    return new Response(null, { status: 204 });

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json({ error: message }, { status });
  }
}

// تابع دریافت پست‌ها
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('Name');
    const nameFull = searchParams.get('NameFull');
    const isActive = searchParams.get('ISActive');
    const parentPostId = searchParams.get('ParentPostID');
    const postCode = searchParams.get('PostCode');

    let whereCondition: Prisma.tblvPostWhereInput = {};

    // فیلتر بر اساس نام
    //if (name) {
    //  whereCondition.Name = {
      //  contains: name,
     //   mode: 'insensitive' as Prisma.QueryMode
   //   };
  //  }

    // فیلتر بر اساس نام کامل
   // if (nameFull) {
   //   whereCondition.NameFull = {
      //  contains: nameFull,
     //   mode: 'insensitive' as Prisma.QueryMode
    //  };
   // }

    // فیلتر بر اساس وضعیت فعال بودن
    if (isActive !== null && isActive !== undefined) {
      whereCondition.ISActive = parseInt(isActive);
    }

    // فیلتر بر اساس ParentPostID
    if (parentPostId) {
      whereCondition.ParentPostID = parseInt(parentPostId);
    }

    // فیلتر بر اساس کد پست
    if (postCode) {
      whereCondition.PostCode = parseInt(postCode);
    }

    const posts = await prisma.tblvPost.findMany({
      where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
      orderBy: { PostID: 'desc' },
      include: {
        tblvPost: {
          select: {
            Name: true,
            NameFull: true,
            PostID: true
          }
        },
        other_tblvPost: {
          select: {
            Name: true,
            NameFull: true,
            PostID: true
          }
        },
        tblvFormPost: {
          include: {
            tblvForm: {
              select: {
                FormNameEN: true,
                FormNameFA: true
              }
            }
          }
        },
        tblvMemberPost: {
          include: {
            tblvMember: {
              select: {
                UserName: true
              }
            }
          }
        }
      }
    });

    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json({ error: message }, { status });
  }
}

// تابع ایجاد پست جدید
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // دریافت فیلدهای اجباری
    const name = formData.get('Name');

    // اعتبارسنجی فیلدهای اجباری
    if (!name) {
      return Response.json(
        { error: "فیلد Name اجباری است" },
        { status: 400 }
      );
    }

    const nameValue = name.toString().trim();

    // اعتبارسنجی طول فیلدها
    if (nameValue.length < 1 || nameValue.length > 50) {
      return Response.json(
        { error: "نام پست باید بین ۱ تا ۵۰ کاراکتر باشد" },
        { status: 400 }
      );
    }

    // بررسی وجود پست تکراری
    const existingPost = await prisma.tblvPost.findFirst({
      where: { 
        Name: nameValue 
      }
    });

    if (existingPost) {
      return Response.json(
        { error: "پست با این نام قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    // دریافت فیلدهای اختیاری
    const parentPostId = formData.get('ParentPostID');
    const postCode = formData.get('PostCode');
    const nameFull = formData.get('NameFull');
    const createDate = formData.get('CreateDate');
    const isActive = formData.get('ISActive');
    const description = formData.get('Description');
    const temp1 = formData.get('Temp1');
    const temp2 = formData.get('Temp2');
    const temp3 = formData.get('Temp3');
    const temp4 = formData.get('Temp4');
    const temp5 = formData.get('Temp5');

    // آماده‌سازی داده‌ها برای ایجاد
    const postDataToCreate: any = {
      Name: nameValue,
      ISActive: isActive ? parseInt(isActive.toString()) : 1, // پیش‌فرض فعال
      CreateDate: createDate ? createDate.toString().trim() : new Date().toISOString().split('T')[0] // پیش‌فرض تاریخ امروز
    };

    // اضافه کردن فیلدهای اختیاری اگر وجود دارند
    if (parentPostId) {
      const parentIdValue = parseInt(parentPostId.toString());
      if (!isNaN(parentIdValue) && parentIdValue > 0) {
        // بررسی وجود پست والد
        const parentExists = await prisma.tblvPost.findUnique({
          where: { PostID: parentIdValue }
        });

        if (!parentExists) {
          return Response.json(
            { error: "پست والد مورد نظر یافت نشد" },
            { status: 404 }
          );
        }
        postDataToCreate.ParentPostID = parentIdValue;
      }
    }

    if (postCode) {
      const postCodeValue = parseInt(postCode.toString());
      if (!isNaN(postCodeValue)) {
        postDataToCreate.PostCode = postCodeValue;
      }
    }

    if (nameFull) {
      const nameFullValue = nameFull.toString().trim();
      if (nameFullValue.length > 0 && nameFullValue.length <= 50) {
        postDataToCreate.NameFull = nameFullValue;
      }
    }

    if (description) {
      postDataToCreate.Description = description.toString().trim();
    }

    // اضافه کردن فیلدهای temp
    const tempFields = ['Temp1', 'Temp2', 'Temp3', 'Temp4', 'Temp5'];
    for (const tempField of tempFields) {
      const value = formData.get(tempField);
      if (value) {
        postDataToCreate[tempField] = value.toString().trim();
      }
    }

    // ایجاد پست جدید
    const newPost = await prisma.tblvPost.create({
      data: postDataToCreate,
      include: {
        tblvPost: {
          select: {
            Name: true,
            NameFull: true
          }
        }
      }
    });

    // بازگرداندن پاسخ موفق
    return Response.json(
      {
        success: true,
        message: "پست با موفقیت ایجاد شد",
        postId: newPost.PostID,
        data: newPost
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

// تابع بروزرسانی پست (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId) || postId <= 0) {
      return Response.json(
        { error: 'شناسه پست معتبر نیست' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    // بررسی وجود پست
    const existingPost = await prisma.tblvPost.findUnique({
      where: { PostID: postId }
    });

    if (!existingPost) {
      return Response.json(
        { error: "پست مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    // آماده‌سازی داده‌ها برای بروزرسانی
    const updateData: Prisma.tblvPostUpdateInput = {};

    // فیلدهای قابل بروزرسانی
    const updatableFields = [
      'ParentPostID', 'PostCode', 'Name', 'NameFull', 'CreateDate', 
      'ISActive', 'Description', 'Temp1', 'Temp2', 'Temp3', 'Temp4', 'Temp5'
    ];

    for (const field of updatableFields) {
      const value = formData.get(field);
      if (value !== null && value !== undefined) {
        if (field === 'ParentPostID' || field === 'PostCode' || field === 'ISActive') {
          const numValue = parseInt(value.toString());
          if (!isNaN(numValue)) {
            if (field === 'ParentPostID' && numValue > 0) {
              // بررسی وجود پست والد
              const parentExists = await prisma.tblvPost.findUnique({
                where: { PostID: numValue }
              });

              if (!parentExists) {
                return Response.json(
                  { error: "پست والد مورد نظر یافت نشد" },
                  { status: 404 }
                );
              }
            }
          //  updateData[field] = numValue;
          }
        } else if (field === 'Name') {
          const nameValue = value.toString().trim();
          if (nameValue.length < 1 || nameValue.length > 50) {
            return Response.json(
              { error: "نام پست باید بین ۱ تا ۵۰ کاراکتر باشد" },
              { status: 400 }
            );
          }
          updateData[field] = nameValue;
        } else if (field === 'NameFull') {
          const nameFullValue = value.toString().trim();
          if (nameFullValue.length > 0 && nameFullValue.length <= 50) {
            updateData[field] = nameFullValue;
          }
        } else {
         // updateData[field] = value.toString().trim();
        }
      }
    }

    // اگر Name تغییر کرده، بررسی تکراری بودن
    const newName = formData.get('Name');
    if (newName && newName.toString().trim() !== existingPost.Name) {
      const duplicatePost = await prisma.tblvPost.findFirst({
        where: { 
          Name: newName.toString().trim(),
          PostID: { not: postId }
        }
      });

      if (duplicatePost) {
        return Response.json(
          { error: "پست با این نام قبلاً ثبت شده است" },
          { status: 409 }
        );
      }
    }

    // بروزرسانی پست
    const updatedPost = await prisma.tblvPost.update({
      where: { PostID: postId },
      data: updateData,
      include: {
        tblvPost: {
          select: {
            Name: true,
            NameFull: true
          }
        },
        other_tblvPost: {
          select: {
            Name: true,
            NameFull: true
          }
        }
      }
    });

    return Response.json(
      {
        success: true,
        message: "پست با موفقیت بروزرسانی شد",
        data: updatedPost
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