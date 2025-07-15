import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  GraduationCap,
  Users,
  ClipboardList,
  FileText,
  Plus,
  BookOpen,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  {
    name: "Add Student",
    href: "/add-student",
    icon: Plus,
  },
  {
    name: "Student Lists",
    href: "/students",
    icon: Users,
  },
  {
    name: "Mark Entry",
    href: "/mark-entry",
    icon: ClipboardList,
  },
  {
    name: "Marksheet",
    href: "/marksheet",
    icon: FileText,
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-1 mobile:p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 mr-1 mobile:mr-2"
              >
                {sidebarOpen ? (
                  <X className="h-4 w-4 mobile:h-5 mobile:w-5" />
                ) : (
                  <Menu className="h-4 w-4 mobile:h-5 mobile:w-5" />
                )}
              </button>

              <GraduationCap className="h-5 w-5 mobile:h-6 mobile:w-6 sm:h-8 sm:w-8 text-primary mr-1 mobile:mr-2 sm:mr-3" />
              <div>
                <h1 className="text-sm mobile:text-lg sm:text-xl font-bold text-foreground">
                  <span className="hidden mobile:inline">
                    GUZIA HIGH SCHOOL
                  </span>
                  <span className="mobile:hidden">GUZIA HIGH</span>
                </h1>
                <p className="text-xs text-muted-foreground hidden mobile:block">
                  Management System
                </p>
              </div>
            </div>
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <nav
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-56 mobile:w-64 bg-card shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:shadow-sm",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "lg:w-64 lg:flex lg:flex-col",
            "mt-14 sm:mt-16 lg:mt-0",
          )}
        >
          <div className="flex-1 flex flex-col min-h-0 pt-4 lg:pt-0">
            <div className="p-3 mobile:p-4">
              <div className="space-y-1 mobile:space-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center px-2 mobile:px-3 py-2 rounded-lg text-xs mobile:text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent",
                      )}
                    >
                      <item.icon className="mr-2 mobile:mr-3 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] lg:ml-0">
          <div className="p-2 mobile:p-3 sm:p-6">
            <div className="max-w-full lg:max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t mt-4 sm:mt-8">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            GUZIA HIGH SCHOOL, Guzia, Shibganj, Bogura
          </p>
        </div>
      </footer>
    </div>
  );
}
