'use client';
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/auth/AuthContext";
import { User } from "lucide-react";
import { usePathname } from "next/navigation";
import sidebarPages from "./sidebarPages.json";
import {
  BarChart2,
  Shield,
  Users,
  Layers,
  BookOpen,
  Book,
  Folder,
  Calendar,
  CheckSquare,
  Bookmark,
  Settings,
} from "lucide-react";
import type { JSX } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  className?: string;
  onMenuClick?: () => void;
  title?: string;
}

const iconMap: { [key: string]: (color: string) => JSX.Element } = {
  "bar-chart": (color: string) => <BarChart2 className="w-6 h-6" style={{ stroke: color }} />,
  "shield": (color: string) => <Shield className="w-6 h-6" style={{ stroke: color }} />,
  "users": (color: string) => <Users className="w-6 h-6" style={{ stroke: color }} />,
  "layers": (color: string) => <Layers className="w-6 h-6" style={{ stroke: color }} />,
  "book-open": (color: string) => <BookOpen className="w-6 h-6" style={{ stroke: color }} />,
  "book": (color: string) => <Book className="w-6 h-6" style={{ stroke: color }} />,
  "folder": (color: string) => <Folder className="w-6 h-6" style={{ stroke: color }} />,
  "calendar": (color: string) => <Calendar className="w-6 h-6" style={{ stroke: color }} />,
  "check-square": (color: string) => <CheckSquare className="w-6 h-6" style={{ stroke: color }} />,
  "bookmarks": (color: string) => <Bookmark className="w-6 h-6" style={{ stroke: color }} />,
  "settings": (color: string) => <Settings className="w-6 h-6" style={{ stroke: color }} />,
};

const Header: React.FC<HeaderProps> = ({ className = "", onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Find the current page's icon
  let currentIcon: string | undefined;
  let sectionName: string | undefined;
  for (const section of sidebarPages) {
    for (const page of section.pages) {
      if (page.path === pathname) {
        currentIcon = page.icon;
        sectionName = section.section;
        break;
      }
    }
    if (currentIcon) break;
  }
  // Set icon color based on section
  let iconColor = "#BDBDBD";
  if (sectionName === "Facilitator") iconColor = "#3B82F6";
  if (sectionName === "Administration") iconColor = "#F97316";

  const userInitial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "S";
  const userName = user?.name || "superAdmin";
  const userEmail = user?.email || "superAdmin@example.com";

  return (
    <header className={`w-full h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 md:px-8 bg-white border-b shadow-sm z-10 ${className}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Hamburger menu for mobile */}
        <button
          className="md:hidden p-2 rounded hover:bg-gray-100 focus:outline-none flex-shrink-0"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="sm:w-6 sm:h-6">
            <rect x="4" y="6" width="16" height="2" rx="1" fill="#D4A72C" />
            <rect x="4" y="11" width="16" height="2" rx="1" fill="#D4A72C" />
            <rect x="4" y="16" width="16" height="2" rx="1" fill="#D4A72C" />
          </svg>
        </button>
        <div className="flex items-center flex-shrink-0">
          {currentIcon && iconMap[currentIcon]?.(iconColor)}
        </div>
        {title && (
          <span className="ml-2 text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">{title}</span>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Notification bell icon */}
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="sm:w-5 sm:h-5">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11c0-3.07-1.64-5.64-5-5.96V4a1 1 0 10-2 0v1.04C6.64 5.36 5 7.92 5 11v3.159c0 .538-.214 1.055-.595 1.436L3 17h5m7 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="#D4A72C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {/* User avatar and dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFF9E5] flex items-center justify-center text-[#D4A72C] font-bold text-base sm:text-lg border border-[#FBBF77] focus:outline-none cursor-pointer"
            onClick={() => setDropdownOpen((open) => !open)}
            aria-label="Open user menu"
          >
            {userInitial}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 animate-fade-in">
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-b">
                <div className="font-bold text-[#0b1320] text-sm sm:text-base truncate">{userName}</div>
                <div className="text-xs sm:text-sm text-[#7b849b] truncate">{userEmail}</div>
              </div>
              <button className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-3 text-[#0b1320] hover:bg-gray-50 text-sm sm:text-base" type="button" onClick={() => { setDropdownOpen(false); router.push('/profile'); }}>
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                Profile
              </button>
              <button
                className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-[#0b1320] hover:bg-gray-50 text-sm sm:text-base border-t"
                onClick={logout}
                type="button"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 