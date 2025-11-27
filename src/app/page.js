'use client'
import React from "react";
//import Footer from "./components/Footer"
import LoginPage from "./components/LoginPage"


export default function Home() {
  return ( // <- این خط اضافه شد
    <div className="min-h-screen flex flex-col">
      
      <LoginPage />
     
    </div>

      
  ); 
}