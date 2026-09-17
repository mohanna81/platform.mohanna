'use client';
import React, { JSX } from "react";
import sidebarPages from "./sidebarPages.json";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { getRoleLevel } from "@/lib/utils/roleHierarchy";
import {
  BarChart2,
  Shield,
  Users,
  Layers,
  BookOpen,
  Book,
  Folder,
  Calendar,
  CalendarDays,
  CheckSquare,
  Bookmark,
  Settings,
  X as CloseIcon
} from "lucide-react";
import Image from "next/image";

interface SidebarPage {
  name: string;
  icon: string;
  path: string;
  roles?: string[];
  excludeRoles?: string[];
}

interface SidebarSection {
  section: string;
  pages: SidebarPage[];
}

const iconMap: { [key: string]: (color: string) => JSX.Element } = {
  "bar-chart": (color: string) => <BarChart2 className="w-5 h-5" style={{ stroke: color }} />,
  "shield": (color: string) => <Shield className="w-5 h-5" style={{ stroke: color }} />,
  "users": (color: string) => <Users className="w-5 h-5" style={{ stroke: color }} />,
  "layers": (color: string) => <Layers className="w-5 h-5" style={{ stroke: color }} />,
  "book-open": (color: string) => <BookOpen className="w-5 h-5" style={{ stroke: color }} />,
  "book": (color: string) => <Book className="w-5 h-5" style={{ stroke: color }} />,
  "folder": (color: string) => <Folder className="w-5 h-5" style={{ stroke: color }} />,
  "calendar": (color: string) => <Calendar className="w-5 h-5" style={{ stroke: color }} />,
  "calendar-days": (color: string) => <CalendarDays className="w-5 h-5" style={{ stroke: color }} />,
  "check-square": (color: string) => <CheckSquare className="w-5 h-5" style={{ stroke: color }} />,
  "bookmarks": (color: string) => <Bookmark className="w-5 h-5" style={{ stroke: color }} />,
  "settings": (color: string) => <Settings className="w-5 h-5" style={{ stroke: color }} />,
};

interface SidebarProps {
  className?: string;
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
}

const Facilitator_COLOR = "#3B82F6"; // blue
const Admin_COLOR = "#F97316"; // orange
const GRAY_ICON = "#BDBDBD";

const Sidebar: React.FC<SidebarProps> = ({ className = "", open = false, onClose, collapsed = false }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  // The mobile drawer (position: fixed, slides over the page) always shows
  // full labels regardless of the desktop collapse preference — an
  // icon-only overlay menu makes little sense on a touch screen where it
  // isn't sharing horizontal space with page content anyway.
  const isCompact = collapsed && !open;

  // Filter sections and pages based on user role
  const filterSectionsByRole = (sections: SidebarSection[]) => {
    if (!user) return sections;
    
    const userRoleLevel = getRoleLevel(user.role);
    
    return sections.map(section => {
      // Filter pages within each section based on roles
      const filteredPages = section.pages.filter(page => {
        // If excludeRoles is specified, check if user's role is excluded
        if (page.excludeRoles && page.excludeRoles.includes(user.role)) {
          return false;
        }
        
        // If roles is specified, check if user's role is in the allowed roles
        if (page.roles) {
          return page.roles.includes(user.role);
        }
        
        // If no roles or excludeRoles specified, page is visible to all
        return true;
      });
      
      // Filter sections based on role level
      if (section.section === "Facilitator" && userRoleLevel < 2) {
        return { ...section, pages: [] }; // Return empty section
      }
      
      return { ...section, pages: filteredPages };
    }).filter(section => section.pages.length > 0); // Remove sections with no visible pages
  };
  
  // Separate settings from other sections and apply role filtering
  const allMainSections = sidebarPages.filter(section => section.section !== "Administration");
  const filteredMainSections = filterSectionsByRole(allMainSections);
  const AdminSection = sidebarPages.find(section => section.section === "Administration");
  
  // Apply role filtering to Administration section
  const filteredAdminSection = AdminSection ? {
    ...AdminSection,
    pages: AdminSection.pages.filter((page: SidebarPage) => {
      if (!user) return true;
      
      // If excludeRoles is specified, check if user's role is excluded
      if (page.excludeRoles && page.excludeRoles.includes(user.role)) {
        return false;
      }
      
      // If roles is specified, check if user's role is in the allowed roles
      if (page.roles && page.roles.includes(user.role)) {
        return true;
      }
      
      // If no roles or excludeRoles specified, page is visible to all
      return true;
    })
  } : null;
  
  return (
    <aside
      className={`
        fixed z-40 inset-y-0 left-0 ${isCompact ? "w-20" : "w-64"} bg-white border-r shadow-md flex flex-col transition-all duration-200
        md:static md:translate-x-0 md:flex
        ${open ? "translate-x-0" : "-translate-x-full"}
        ${className}
      `}
      style={{ height: '100vh' }}
    >
      {/* Close button for mobile */}
      <div className="md:hidden flex justify-end p-3">
        <button onClick={onClose} aria-label="Close sidebar">
          <CloseIcon className="w-6 h-6 text-gray-500" />
        </button>
      </div>
      {/* Logo — height matches the main Header bar (h-14 sm:h-16) exactly
          so the two border-b lines land on the same row instead of the
          sidebar's sitting lower. */}
      <div className="flex items-center justify-center h-14 sm:h-16 border-b bg-[#FFF9E5] px-3 flex-shrink-0">
        {isCompact ? (
          <Image src="/Images/logo-icon.png" alt="Risk Sharing Platform" width={32} height={32} priority className="object-contain" />
        ) : (
          <Image src="/Images/logo.png" alt="Risk Sharing Platform Logo" width={160} height={56} priority className="object-contain" />
        )}
      </div>
      {/* The collapse/expand toggle button lives in Layout.tsx, not here —
          this `aside` has translate-x transform classes (for the mobile
          slide-in drawer), which makes it a stacking-context root, so a
          `position: fixed` child here has its z-index compared only
          within that local context. Header (same z-40, later in the DOM
          at the Layout level) would then paint over anything the button
          drew past the sidebar's own edge. Rendering the button as a
          sibling of both Sidebar and Header in Layout avoids that trap. */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="mt-4 px-2 flex-1 flex flex-col">
          <div>
            {filteredMainSections.map(section => (
              <div key={section.section} className="mb-6">
                {!isCompact && (
                  <div className="text-xs font-semibold text-[#BDBDBD] uppercase px-4 mb-2 tracking-wider whitespace-nowrap">
                    {section.section}
                  </div>
                )}
                <ul>
                  {section.pages.map((page: SidebarPage) => {
                    const isActive = pathname === page.path;
                    // Facilitator section: blue bar and icon
                    const isFacilitator = section.section === "Facilitator";
                    const iconColor = isFacilitator ? Facilitator_COLOR : GRAY_ICON;
                    return (
                      <li key={page.name}>
                        <Link
                          href={page.path}
                          title={isCompact ? page.name : undefined}
                          className={`flex items-center rounded-lg text-sm font-medium transition whitespace-nowrap relative
                            ${isCompact ? "justify-center px-2 py-2.5" : "gap-3 px-4 py-2"}
                            ${isActive ? "bg-[#FFF9E5] text-[#1A2343] font-semibold shadow-sm" : "text-[#2D2D2D] hover:bg-[#F5F5F5]"}
                          `}
                          onClick={onClose}
                        >
                          {isFacilitator && !isCompact && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded bg-[#3B82F6]" />
                          )}
                          <span className="relative z-10">{iconMap[page.icon]?.(iconColor) || <span className="w-5 h-5" />}</span>
                          {!isCompact && <span className="relative z-10">{page.name}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {/* Risk Sharing Hub — external link */}
          <div className="mb-4">
            <a
              href="https://risksharinghub.org/"
              target="_blank"
              rel="noopener noreferrer"
              title={isCompact ? "Risk Sharing Hub" : undefined}
              className={`flex items-center rounded-lg text-sm font-medium transition text-[#2D2D2D] hover:bg-[#F5F5F5] whitespace-nowrap ${isCompact ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"}`}
              onClick={onClose}
            >
              <Image
                src="/Images/Risk Sharing Hub icon cropped.png"
                alt="Risk Sharing Hub"
                width={30}
                height={30}
                className="object-contain flex-shrink-0"
              />
              {!isCompact && (
                <>
                  <span>
                    <span className="font-bold text-[#2B4EAE]">Risk Sharing </span>
                    <span className="font-bold text-[#F5A623]">Hub</span>
                  </span>
                  <svg className="w-3 h-3 ml-auto text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </>
              )}
            </a>
          </div>

          {filteredAdminSection && filteredAdminSection.pages.length > 0 && (
            <div className="mt-8 pt-2 border-t border-gray-100">
              {!isCompact && (
                <div className="text-xs font-semibold text-[#BDBDBD] uppercase px-4 mb-2 tracking-wider whitespace-nowrap">
                  {filteredAdminSection.section}
                </div>
              )}
              <ul>
                {filteredAdminSection.pages.map((page: SidebarPage) => {
                  const isActive = pathname === page.path;
                  // Only Settings: orange bar and icon
                  const iconColor = Admin_COLOR;
                  return (
                    <li key={page.name}>
                      <Link
                        href={page.path}
                        title={isCompact ? page.name : undefined}
                        className={`flex items-center rounded-lg text-sm font-medium transition whitespace-nowrap relative
                          ${isCompact ? "justify-center px-2 py-2.5" : "gap-3 px-4 py-2"}
                          ${isActive ? "bg-[#FFF9E5] text-[#1A2343] font-semibold shadow-sm" : "text-[#2D2D2D] hover:bg-[#F5F5F5]"}
                        `}
                        onClick={onClose}
                      >
                        {!isCompact && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded bg-[#F97316]" />}
                        <span className="relative z-10">{iconMap[page.icon]?.(iconColor) || <span className="w-5 h-5" />}</span>
                        {!isCompact && <span className="relative z-10">{page.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar; 