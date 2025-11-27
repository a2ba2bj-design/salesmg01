'use client'
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import WEB from "../../../../public/firspage0.jpeg";
import { authenticateUser } from "../../actions/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [post, setPost] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState([]);
  const router = useRouter();

  // دریافت لیست پست‌ها از سرور
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    
    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('post', post);

      const result = await authenticateUser(formData);
      
      if (!result.success) {
        setError(result.message);
      }
      // اگر موفق باشد، redirect در سرور اکشن انجام می‌شود

    } catch (error) {
      setError("خطا در ارتباط با سرور");
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative w-full flex-grow min-h-screen z-0 ">
      <Image
        src={WEB}
        alt="Background image"
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
        className="object-cover object-bottom"
        priority
      />
      
      <div className="absolute top-1/2 right-4 md:right-8 lg:right-16 xl:right-24 transform -translate-y-1/2 w-full max-w-xs md:max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-6 border border-gray-200">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl font-bold">🔒</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">ورود به سیستم</h2>
            <p className="text-gray-600 mt-1 text-xs">لطفاً اطلاعات حساب خود را وارد کنید</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* فیلد نام کاربری */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                نام کاربری
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 text-right text-gray-800"
                  placeholder="نام کاربری خود را وارد کنید"
                  required
                  disabled={loading}
                />
                <div className="absolute left-3 top-3 text-blue-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* فیلد رمز عبور */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 text-right text-gray-800 pr-12"
                  placeholder="رمز عبور خود را وارد کنید"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-blue-500 hover:text-blue-700 transition-colors duration-200"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Dropdown انتخاب پست */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                انتخاب پست
              </label>
              <div className="relative">
                <select
                  value={post}
                  onChange={(e) => setPost(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200 text-right text-gray-800 appearance-none cursor-pointer"
                  required
                  disabled={loading}
                >
                  <option value="">لطفاً پست خود را انتخاب کنید</option>
                  {posts.map((postItem: any) => (
                    <option key={postItem.PostID} value={postItem.PostID}>
                      {postItem.Name}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-3 text-blue-500 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* گزینه‌های اضافی */}
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-600">مرا به خاطر بسپار</span>
              </label>
              
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200">
                رمز عبور را فراموش کرده‌اید؟
              </a>
            </div>

            {/* دکمه ورود */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>در حال ورود...</span>
                </div>
              ) : (
                'ورود به سیستم'
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              سیستم مدیریت فروشگاهی - نسخه ۱.۰
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}