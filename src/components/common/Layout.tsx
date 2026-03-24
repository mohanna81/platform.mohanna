"use client";
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { usePathname } from "next/navigation";
import sidebarPages from "./sidebarPages.json";
import ToastContainer from './ToastContainer';

function getPageTitle(pathname: string) {
  for (const section of sidebarPages) {
    for (const page of section.pages) {
      if (page.path === pathname) return page.name;
    }
  }
  return "";
}

const Layout: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = title || getPageTitle(pathname);
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar: hidden on mobile, visible on md+ */}
      <Sidebar className="h-full" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-hidden">
        <Header className="w-full flex-shrink-0" title={pageTitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-gray-50">{children}</main>
        <ToastContainer />
      </div>
    </div>
  );
};

export default Layout; 