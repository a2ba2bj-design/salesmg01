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

// تابع حذف MemberPost
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memberPostId = parseInt(id);

    if (isNaN(memberPostId) || memberPostId <= 0) {
      return Response.json(
        { error: 'شناسه MemberPost معتبر نیست' },
        { status: 400 }
      );
    }

    await prisma.tblvMemberPost.delete({
      where: { MemberPostID: memberPostId }
    });

    return new Response(null, { status: 204 });

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json({ error: message }, { status });
  }
}

// تابع دریافت MemberPost ها
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('MemberID');
    const postId = searchParams.get('PostID');
    const isActive = searchParams.get('ISActive');

    let whereCondition: Prisma.tblvMemberPostWhereInput = {};

    // فیلتر بر اساس MemberID
    if (memberId) {
      whereCondition.MemberID = parseInt(memberId);
    }

    // فیلتر بر اساس PostID
    if (postId) {
      whereCondition.PostID = parseInt(postId);
    }

    // فیلتر بر اساس وضعیت فعال بودن
    if (isActive !== null && isActive !== undefined) {
      whereCondition.ISActive = parseInt(isActive);
    }

    const memberPosts = await prisma.tblvMemberPost.findMany({
      where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
      orderBy: { MemberPostID: 'desc' },
      include: {
        tblvMember: {
          select: {
            UserName: true,
            MemberID: true
          }
        },
        tblvPost: {
          select: {
            PostNameEN: true,
            PostNameFA: true,
            PostID: true
          }
        }
      }
    });

    return new Response(JSON.stringify(memberPosts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return Response.json({ error: message }, { status });
  }
}

// تابع ایجاد MemberPost جدید
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // دریافت فیلدهای اجباری
    const memberId = formData.get('MemberID');
    const postId = formData.get('PostID');

    // اعتبارسنجی فیلدهای اجباری
    if (!memberId || !postId) {
      return Response.json(
        { error: "فیلدهای MemberID و PostID اجباری هستند" },
        { status: 400 }
      );
    }

    const memberIdValue = parseInt(memberId.toString());
    const postIdValue = parseInt(postId.toString());

    // اعتبارسنجی مقادیر عددی
    if (isNaN(memberIdValue) || memberIdValue <= 0) {
      return Response.json(
        { error: "MemberID باید یک عدد معتبر باشد" },
        { status: 400 }
      );
    }

    if (isNaN(postIdValue) || postIdValue <= 0) {
      return Response.json(
        { error: "PostID باید یک عدد معتبر باشد" },
        { status: 400 }
      );
    }

    // بررسی وجود Member و Post
    const memberExists = await prisma.tblvMember.findUnique({
      where: { MemberID: memberIdValue }
    });

    if (!memberExists) {
      return Response.json(
        { error: "کاربر مورد نظر یافت نشد" },
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
    const existingMemberPost = await prisma.tblvMemberPost.findFirst({
      where: { 
        MemberID: memberIdValue,
        PostID: postIdValue
      }
    });

    if (existingMemberPost) {
      return Response.json(
        { error: "این ارتباط کاربر و پست قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    // دریافت فیلدهای اختیاری
    const isActive = formData.get('ISActive');
    const createDate = formData.get('CreateDate');

    // آماده‌سازی داده‌ها برای ایجاد
    const memberPostDataToCreate = {
      MemberID: memberIdValue,
      PostID: postIdValue,
      ISActive: isActive ? parseInt(isActive.toString()) : 1, // پیش‌فرض فعال
      CreateDate: createDate ? createDate.toString().trim() : new Date().toISOString().split('T')[0] // پیش‌فرض تاریخ امروز
    };

    // ایجاد MemberPost جدید
    const newMemberPost = await prisma.tblvMemberPost.create({
      data: memberPostDataToCreate,
      include: {
        tblvMember: {
          select: {
            UserName: true,
            MemberID: true
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
        message: "ارتباط کاربر و پست با موفقیت ایجاد شد",
        memberPostId: newMemberPost.MemberPostID,
        data: newMemberPost
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

// تابع بروزرسانی MemberPost (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memberPostId = parseInt(id);

    if (isNaN(memberPostId) || memberPostId <= 0) {
      return Response.json(
        { error: 'شناسه MemberPost معتبر نیست' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    // بررسی وجود MemberPost
    const existingMemberPost = await prisma.tblvMemberPost.findUnique({
      where: { MemberPostID: memberPostId }
    });

    if (!existingMemberPost) {
      return Response.json(
        { error: "ارتباط کاربر و پست مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    // آماده‌سازی داده‌ها برای بروزرسانی
    const updateData: Prisma.tblvMemberPostUpdateInput = {};

    // فیلدهای قابل بروزرسانی
    const updatableFields = ['ISActive', 'CreateDate'];

    for (const field of updatableFields) {
      const value = formData.get(field);
      if (value !== null && value !== undefined) {
        if (field === 'ISActive') {
          updateData[field] = parseInt(value.toString());
        } else {
          updateData[field] = value.toString().trim();
        }
      }
    }

    // اگر MemberID یا PostID ارسال شده، بررسی تکراری بودن
    const newMemberId = formData.get('MemberID');
    const newPostId = formData.get('PostID');

    if (newMemberId || newPostId) {
      const checkMemberId = newMemberId ? parseInt(newMemberId.toString()) : existingMemberPost.MemberID;
      const checkPostId = newPostId ? parseInt(newPostId.toString()) : existingMemberPost.PostID;

      if (checkMemberId !== existingMemberPost.MemberID || checkPostId !== existingMemberPost.PostID) {
        const duplicateMemberPost = await prisma.tblvMemberPost.findFirst({
          where: { 
            MemberID: checkMemberId,
            PostID: checkPostId,
            MemberPostID: { not: memberPostId }
          }
        });

        if (duplicateMemberPost) {
          return Response.json(
            { error: "این ارتباط کاربر و پست قبلاً ثبت شده است" },
            { status: 409 }
          );
        }
      }

      // اضافه کردن MemberID و PostID به داده‌های بروزرسانی اگر ارسال شده‌اند
      if (newMemberId) {
        const memberIdValue = parseInt(newMemberId.toString());
        
        // بررسی وجود Member جدید
        const memberExists = await prisma.tblvMember.findUnique({
          where: { MemberID: memberIdValue }
        });

        if (!memberExists) {
          return Response.json(
            { error: "کاربر مورد نظر یافت نشد" },
            { status: 404 }
          );
        }

        updateData.MemberID = memberIdValue;
        updateData.tblvMember = { connect: { MemberID: memberIdValue } };
      }

      if (newPostId) {
        const postIdValue = parseInt(newPostId.toString());
        
        // بررسی وجود Post جدید
        const postExists = await prisma.tblvPost.findUnique({
          where: { PostID: postIdValue }
        });

        if (!postExists) {
          return Response.json(
            { error: "پست مورد نظر یافت نشد" },
            { status: 404 }
          );
        }

        updateData.PostID = postIdValue;
        updateData.tblvPost = { connect: { PostID: postIdValue } };
      }
    }

    // بروزرسانی MemberPost
    const updatedMemberPost = await prisma.tblvMemberPost.update({
      where: { MemberPostID: memberPostId },
      data: updateData,
      include: {
        tblvMember: {
          select: {
            UserName: true,
            MemberID: true
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
        message: "ارتباط کاربر و پست با موفقیت بروزرسانی شد",
        data: updatedMemberPost
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