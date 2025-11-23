import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '../../../generated/prisma/client'
import { makeSerializable } from "../../lib/util";
const prisma = new PrismaClient()


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
    try{

        const formData  = await (request.formData());
        const UserName1  = formData.get('UserName');
        const Password1  = formData.get('Password');
     
      const t=await prisma.tblvMember.create({
            data: {
            UserName:UserName1?.toString(),
            Password:Password1?.toString(),
             // groupname:groupname.toString(),
              //name:name.toString(),
             
              
             
        
            }
          })
       
       
          return new Response(JSON.stringify(t.id), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        catch(error){
       
          return new Response(error, {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            
            
          });
        }
        
  }