import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '../../../generated/prisma/client';
import { makeSerializable } from "../../lib/util";
//import { PrismaClient } from '../../generated/prisma/client'
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';


// شروع تابع حذف کاربر
export async function DELETE(
  request: NextRequest ,
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
    console.error('Error deleting member:', error);

    // راه‌حل پیشنهادی: استفاده از type assertion
    if ((error as any).code === 'P2025') {
      return Response.json(
        { error: 'عضو مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // یا استفاده از بررسی ایمن
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return Response.json(
        { error: 'عضو مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    return Response.json(
      { error: 'خطا در حذف عضو' },
      { status: 500 }
    );
  }
}
  //پایان تابع حذف کاربر

//شروع تابع برای انتخاب یا selectکاربر

 export async function GET(request: NextRequest  )
   
  {
    const searchParams = request.nextUrl.searchParams;
    const UserName1 = searchParams.get('UserName');
    let cats;
    if (!UserName1){
 cats =makeSerializable( await prisma.tblvMember.findMany( {
           
          }))
    }
    else{
       cats =makeSerializable(await prisma.tblvMember.findMany( {
            where:{
                  UserName:UserName1.toString()
          },
          }))}
       return new Response(JSON.stringify(cats)    
    , {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  //پایان تابع انتخاب
 

  //شروع تابع Insert


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const UserName1 = formData.get('UserName');
    const Password1 = formData.get('Password');

    // اعتبارسنجی فیلدهای اجباری
    if (!UserName1 || !Password1) {
      return new Response(
        JSON.stringify({ 
          error: "فیلدهای UserName و Password اجباری هستند" 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // اعتبارسنجی طول فیلدها
    if (UserName1.toString().length < 3 || Password1.toString().length < 6) {
      return new Response(
        JSON.stringify({ 
          error: "نام کاربری حداقل ۳ کاراکتر و رمز عبور حداقل ۶ کاراکتر باید باشد" 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // بررسی وجود کاربر تکراری
    const existingUser = await prisma.tblvMember.findFirst({
      where: {
        UserName: UserName1.toString()
      }
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ 
          error: "نام کاربری قبلاً ثبت شده است" 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // هش کردن رمز عبور (استفاده از bcrypt)
    const hashedPassword = await bcrypt.hash(Password1.toString(), 12);

    // ایجاد کاربر جدید
    const newMember = await prisma.tblvMember.create({
      data: {
        UserName: UserName1.toString().trim(),
        Password: hashedPassword,
        // CreateDate: new Date(), // اگر فیلد در schema وجود دارد
        // IsActive: true // اگر فیلد در schema وجود دارد
      }
    });

    // بازگرداندن پاسخ موفق بدون اطلاعات حساس
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "کاربر با موفقیت ایجاد شد",
        memberId: newMember.MemberID 
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    // لاگ کردن خطا برای debugging
    console.error("Error creating member:", error);

    // مدیریت ایمن خطا
    let errorMessage = "خطای سرور داخلی";
    let statusCode = 500;

    // بررسی نوع خطا
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        errorMessage = "نام کاربری تکراری است";
        statusCode = 409;
      } else if (error.code === 'P2003') {
        errorMessage = "خطای ارجاع خارجی";
        statusCode = 400;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // بازگرداندن خطای امن به کاربر
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}