'use client'
import React from "react";
import Link from "next/link";

export default function index() {
  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* درباره ما */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4">درباره ما</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              ما یک تیم متخصص در زمینه ارائه راهکارهای دیجیتال هستیم. 
              با سال‌ها تجربه در زمینه طراحی و توسعه، آماده کمک به رشد کسب و کار شما هستیم.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition duration-300">
                📘
              </a>
              <a href="#" className="bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition duration-300">
                📷
              </a>
              <a href="#" className="bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition duration-300">
                🐦
              </a>
            </div>
          </div>

          {/* لینک‌های سریع */}
          <div>
            <h3 className="text-xl font-bold mb-4">لینک‌های سریع</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/" className="text-gray-300 hover:text-white transition duration-300">
                صفحه اصلی
              </Link>
              <Link href="/services" className="text-gray-300 hover:text-white transition duration-300">
                خدمات
              </Link>
              <Link href="/about" className="text-gray-300 hover:text-white transition duration-300">
                درباره ما
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-white transition duration-300">
                تماس با ما
              </Link>
            </div>
          </div>

          {/* اطلاعات تماس */}
          <div>
            <h3 className="text-xl font-bold mb-4">تماس با ما</h3>
            <div className="space-y-2 text-gray-300">
              <p>📧 info@example.com</p>
              <p>📞 ۰۲۱-۱۲۳۴۵۶۷۸</p>
              <p>📱 ۰۹۱۲۳۴۵۶۷۸۹</p>
              <p>📍 تهران، خیابان نمونه</p>
            </div>
          </div>
        </div>

        {/* خط جداکننده */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-center md:text-right">
              © ۲۰۲۴ تمام حقوق این سایت محفوظ است.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-300 hover:text-white text-sm">
                حریم خصوصی
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-white text-sm">
                شرایط استفاده
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}