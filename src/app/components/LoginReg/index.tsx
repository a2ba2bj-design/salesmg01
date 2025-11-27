
'use client'
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
//import WEB from "../../../../public/firspage0.jpeg";

export default function LoginReg() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [post, setPost] = useState(""); // حالت برای پست انتخابی
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // لیست پست‌های موجود
  const posts = [
    { value: "manager", label: "مدیر سیستم" },
    { value: "sales", label: "کارمند فروش" },
    { value: "warehouse", label: "انباردار" },
    { value: "financial", label: "مسئول مالی" },
    { value: "support", label: "پشتیبان" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ایجاد FormData برای ارسال به API
      const formData = new FormData();
      formData.append('UserName', username);
      formData.append('Password', password);

      // ارسال درخواست به API
      const response = await axios.post('/api/members', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        // ذخیره اطلاعات کاربر در localStorage در صورت انتخاب "مرا به خاطر بسپار"
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify({
            username,
            post,
            memberId: response.data.memberId
          }));
        } else {
          sessionStorage.setItem('user', JSON.stringify({
            username,
            post,
            memberId: response.data.memberId
          }));
        }

        // ثبت لاگ ورود کاربر (اختیاری)
        await logUserLogin(response.data.memberId);

        // هدایت به صفحه اصلی
        router.push('/dashboard'); // یا هر مسیر دیگری که می‌خواهید
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || "خطا در ورود به سیستم");
    } finally {
      setLoading(false);
    }
  };

  // تابع برای ثبت لاگ ورود کاربر (اختیاری)
  const logUserLogin = async (memberId: number) => {
    try {
      const loginData = new FormData();
      loginData.append('MemberID', memberId.toString());
      loginData.append('LoginPostID', '1'); // ID پست مربوطه
      loginData.append('LoginDate', new Date().toISOString());
      loginData.append('ISActive', '1');

      await axios.post('/api/memberlogs', loginData);
    } catch (error) {
      console.error('Error logging user login:', error);
    }
  };

  // بررسی اگر کاربر قبلاً لاگین کرده
  React.useEffect(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (savedUser) {
      router.push('/dashboard');
    }
  }, [router]);
