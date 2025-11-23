import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../../public/Styles/style.css"

export const metadata = {
  title: "سایت ورزشی",
  description: "باشگاه برتر با نازلترین قیمت",
  keywords: "کیفیت, برتری, آنلاین",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body dir="rtl">
        {children}
      </body>
    </html>
  );
}


