import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Users,
  ClipboardList,
  FileText,
  Plus,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/database";

export default function Index() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    studentsByClass: [] as { class: number; count: number }[],
    recentActivities: [] as string[],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get total students
      const totalStudents = await db.students.count();

      // Get students by class
      const students = await db.students.toArray();
      const classCounts = students.reduce(
        (acc, student) => {
          acc[student.class] = (acc[student.class] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

      const studentsByClass = Object.entries(classCounts).map(
        ([cls, count]) => ({
          class: parseInt(cls),
          count: count as number,
        }),
      );

      setStats({
        totalStudents,
        studentsByClass,
        recentActivities: [
          "System initialized successfully",
          "Ready to manage student data",
          "All features available",
        ],
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const quickActions = [
    {
      title: "Add Student",
      description: "Register a new student",
      icon: Plus,
      href: "/add-student",
      color: "bg-primary",
    },
    {
      title: "View Students",
      description: "Browse all students",
      icon: Users,
      href: "/students",
      color: "bg-accent",
    },
    {
      title: "Mark Entry",
      description: "Enter student marks",
      icon: ClipboardList,
      href: "/mark-entry",
      color: "bg-secondary",
    },
    {
      title: "Generate Marksheet",
      description: "Create marksheets",
      icon: FileText,
      href: "/marksheet",
      color: "bg-muted",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <GraduationCap className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome to GUZIA HIGH SCHOOL
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Complete management system for student records, mark entry, and
          marksheet generation. Manage your school efficiently with our modern
          digital platform.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.title} to={action.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div
                  className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}
                >
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Student Statistics
            </CardTitle>
            <CardDescription>
              Overview of student enrollment by class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Students</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {stats.totalStudents}
                </Badge>
              </div>
              {stats.studentsByClass.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    By Class:
                  </h4>
                  {stats.studentsByClass
                    .sort((a, b) => a.class - b.class)
                    .map((item) => (
                      <div
                        key={item.class}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">Class {item.class}</span>
                        <Badge variant="outline">{item.count} students</Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No students registered yet. Start by adding your first
                  student!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">{activity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Quick guide to use the school management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">1. Add Students</h4>
              <p className="text-sm text-muted-foreground">
                Start by adding students with their basic information including
                name, roll number, class, and section.
              </p>
              <Link to="/add-student">
                <Button variant="outline" size="sm">
                  Add Your First Student
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">2. Manage Records</h4>
              <p className="text-sm text-muted-foreground">
                View, edit, and manage all student records with powerful
                filtering and search capabilities.
              </p>
              <Link to="/students">
                <Button variant="outline" size="sm">
                  View Student Lists
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
