import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Download,
  Upload,
  X,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { db, Student, getGroups, Mark } from "@/lib/database";
import * as XLSX from "xlsx";

interface FilterState {
  name: string;
  class: string;
  section: string;
  group: string;
  roll: string;
}

export function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    name: "",
    class: "all",
    section: "all",
    group: "all",
    roll: "",
  });

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, filters]);

  const loadStudents = async () => {
    try {
      setError(null);
      const allStudents = await db.students.orderBy("roll").toArray();
      setStudents(allStudents);
    } catch (err) {
      console.error("Error loading students:", err);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };
  const deleteDuplicateStudents = async () => {
    try {
      const allStudents = await db.students.toArray();
      const uniqueRolls = new Set<string>();
      const duplicates: number[] = [];

      allStudents.forEach((student) => {
        const key = `${student.class}-${student.group || student.section}-${student.roll}`;
        if (uniqueRolls.has(key)) {
          duplicates.push(student.id!);
        } else {
          uniqueRolls.add(key);
        }
      });

      // Delete duplicates
      for (const id of duplicates) {
        await db.students.delete(id);
        await db.marks.where("studentId").equals(id).delete(); // optional: remove associated marks
      }

      toast.success(`${duplicates.length} duplicate roll(s) removed`);
      loadStudents();
    } catch (error) {
      console.error("Error deleting duplicates:", error);
      toast.error("Failed to remove duplicate rolls");
    }
  };
  const deleteAllData = async () => {
    const confirmed = window.confirm("Are you sure you want to delete ALL student data? This cannot be undone.");
    if (!confirmed) return;

    try {
      await db.students.clear();
      await db.marks.clear();

      toast.success("All student and marks data deleted");
      loadStudents(); // reload to reflect empty state
    } catch (error) {
      console.error("Failed to delete all data:", error);
      toast.error("Failed to delete all data");
    }
  };



  const applyFilters = () => {
    let filtered = students;

    if (filters.name) {
      filtered = filtered.filter((student) =>
        student.name.toLowerCase().includes(filters.name.toLowerCase()),
      );
    }

    if (filters.class !== "all") {
      filtered = filtered.filter(
        (student) => student.class.toString() === filters.class,
      );
    }

    if (filters.section !== "all") {
      filtered = filtered.filter(
        (student) => student.section === filters.section,
      );
    }

    if (filters.group !== "all") {
      filtered = filtered.filter((student) => student.group === filters.group);
    }

    if (filters.roll) {
      filtered = filtered.filter((student) =>
        student.roll.toString().includes(filters.roll),
      );
    }

    setFilteredStudents(filtered);
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      class: "all",
      section: "all",
      group: "all",
      roll: "",
    });
  };

  const handleDelete = async (studentId: number, studentName: string) => {
    try {
      await db.students.delete(studentId);
      await db.marks.where("studentId").equals(studentId).delete();
      toast.success(`${studentName} deleted successfully`);
      loadStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    }
  };





  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading students...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mobile:space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-lg mobile:text-xl md:text-2xl font-bold">
            📋 Student Lists
          </h1>
          <p className="text-muted-foreground text-xs mobile:text-sm md:text-base">
            Manage all students in GUZIA HIGH SCHOOL
          </p>
        </div>

        {/* ✅ Action Buttons */}
        <div className="flex flex-col mobile:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={deleteAllData}
            className="w-full mobile:w-auto text-xs mobile:text-sm"
          >
            <Trash2 className="mr-1 mobile:mr-2 h-3 w-3 mobile:h-4 mobile:w-4" />
            <span className="hidden mobile:inline">Delete All</span>
            <span className="mobile:hidden">Wipe</span>
          </Button>

          <Button
            variant="outline"
            onClick={deleteDuplicateStudents}
            className="w-full mobile:w-auto text-xs mobile:text-sm"
          >
            <Trash2 className="mr-1 mobile:mr-2 h-3 w-3 mobile:h-4 mobile:w-4" />
            <span className="hidden mobile:inline">Delete Duplicate Rolls</span>
            <span className="mobile:hidden">Dedup</span>
          </Button>

          <Link to="/add-student" className="w-full mobile:w-auto">
            <Button className="w-full mobile:w-auto text-xs mobile:text-sm">
              <Plus className="mr-1 mobile:mr-2 h-3 w-3 mobile:h-4 mobile:w-4" />
              <span className="hidden mobile:inline">Add Student</span>
              <span className="mobile:hidden">Add</span>
            </Button>
          </Link>
        </div>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4 mobile:pb-6">
          <CardTitle className="flex items-center gap-2 text-base mobile:text-lg">
            <Filter className="h-3 w-3 mobile:h-4 mobile:w-4" />
            Advanced Filters
          </CardTitle>
          <CardDescription className="text-xs mobile:text-sm">
            Filter students by name, class, section, group, roll number, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 mobile:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mobile:gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Name</Label>
              <Input
                id="filter-name"
                placeholder="Search by name..."
                value={filters.name}
                onChange={(e) =>
                  setFilters({ ...filters, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-class">Class</Label>
              <Select
                value={filters.class}
                onValueChange={(value) =>
                  setFilters({ ...filters, class: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {[6, 7, 8, 9, 10].map((cls) => (
                    <SelectItem key={cls} value={cls.toString()}>
                      Class {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-section">Section</Label>
              <Select
                value={filters.section}
                onValueChange={(value) =>
                  setFilters({ ...filters, section: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sections</SelectItem>
                  {["A", "B"].map((section) => (
                    <SelectItem key={section} value={section}>
                      Section {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-group">Group</Label>
              <Select
                value={filters.group}
                onValueChange={(value) =>
                  setFilters({ ...filters, group: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {getGroups(9).map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-roll">Roll</Label>
              <Input
                id="filter-roll"
                placeholder="Roll number..."
                value={filters.roll}
                onChange={(e) =>
                  setFilters({ ...filters, roll: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex flex-col mobile:flex-row mobile:justify-between mobile:items-center gap-3 mt-4">
            <p className="text-xs mobile:text-sm text-muted-foreground">
              Showing {filteredStudents.length} of {students.length} students
            </p>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full mobile:w-auto text-xs mobile:text-sm"
            >
              <X className="mr-1 mobile:mr-2 h-3 w-3 mobile:h-4 mobile:w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students Display - Cards on Mobile, Table on Desktop */}

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-muted-foreground text-sm">
                {students.length === 0
                  ? "No students found. Add your first student!"
                  : "No students match the current filters."}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-gray-900">
                      {student.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        Roll {student.roll}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Class {student.class}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-3">
                    <Link to={`/edit-student/${student.id}`}>
                      <Button variant="ghost" size="sm" className="p-2">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-2">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Student</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {student.name}? This
                            action cannot be undone and will also remove all
                            associated marks.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDelete(student.id!, student.name)
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  {student.group ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium">Group:</span>
                      <Badge variant="outline" className="text-xs">
                        {student.group}
                      </Badge>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium">Section:</span>
                      <Badge variant="outline" className="text-xs">
                        {student.section}
                      </Badge>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Name</TableHead>
                  <TableHead className="min-w-[60px]">Roll</TableHead>
                  <TableHead className="min-w-[70px]">Class</TableHead>
                  <TableHead className="min-w-[100px]">Section/Group</TableHead>
                  <TableHead className="text-right min-w-[80px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {students.length === 0
                          ? "No students found. Add your first student!"
                          : "No students match the current filters."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium text-xs mobile:text-sm px-2 mobile:px-4">
                        {student.name}
                      </TableCell>
                      <TableCell className="px-2 mobile:px-4">
                        <Badge
                          variant="outline"
                          className="text-xs mobile:text-sm px-1 mobile:px-2"
                        >
                          {student.roll}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs mobile:text-sm px-2 mobile:px-4">
                        Class {student.class}
                      </TableCell>
                      <TableCell className="px-2 mobile:px-4">
                        {student.group ? (
                          <Badge
                            variant="secondary"
                            className="text-xs mobile:text-sm px-1 mobile:px-2"
                          >
                            {student.group}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs mobile:text-sm px-1 mobile:px-2"
                          >
                            Section {student.section}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right px-2 mobile:px-4">
                        <div className="flex justify-end gap-1 mobile:gap-2">
                          <Link to={`/edit-student/${student.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 mobile:p-2"
                            >
                              <Edit className="h-3 w-3 mobile:h-4 mobile:w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 mobile:p-2"
                              >
                                <Trash2 className="h-3 w-3 mobile:h-4 mobile:w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Student
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {student.name}
                                  ? This action cannot be undone and will also
                                  remove all associated marks.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDelete(student.id!, student.name)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
