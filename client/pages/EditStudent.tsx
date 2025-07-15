import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { toast } from "sonner";
import { db, Student, getGroups } from "@/lib/database";

export function EditStudent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    name: "",
    roll: "",
    class: "",
    section: "",
    group: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalStudent, setOriginalStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudent();
  }, [id]);

  const loadStudent = async () => {
    if (!id) {
      toast.error("Invalid student ID");
      navigate("/students");
      return;
    }

    try {
      const student = await db.students.get(parseInt(id));
      if (!student) {
        toast.error("Student not found");
        navigate("/students");
        return;
      }

      setOriginalStudent(student);
      setFormData({
        name: student.name,
        roll: student.roll.toString(),
        class: student.class.toString(),
        section: student.section || "",
        group: student.group || "",
      });
    } catch (error) {
      console.error("Error loading student:", error);
      toast.error("Failed to load student");
      navigate("/students");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      const selectedClass = parseInt(formData.class);
      const isHighClass = selectedClass >= 9 && selectedClass <= 10;

      if (
        !formData.name ||
        !formData.roll ||
        !formData.class ||
        (!isHighClass && !formData.section) ||
        (isHighClass && !formData.group)
      ) {
        toast.error("All fields are required");
        return;
      }

      // Check if roll already exists in the same class and section/group (excluding current student)
      const existingStudents = await db.students
        .filter((student) => {
          if (student.id === originalStudent?.id) return false; // Exclude current student

          if (isHighClass) {
            return (
              student.roll === parseInt(formData.roll) &&
              student.class === parseInt(formData.class) &&
              student.group === formData.group
            );
          } else {
            return (
              student.roll === parseInt(formData.roll) &&
              student.class === parseInt(formData.class) &&
              student.section === formData.section
            );
          }
        })
        .toArray();

      if (existingStudents.length > 0) {
        const groupOrSection = isHighClass ? "group" : "section";
        toast.error(
          `A student with this roll number already exists in this class and ${groupOrSection}`,
        );
        return;
      }

      const updatedStudent: Student = {
        ...originalStudent!,
        name: formData.name,
        roll: parseInt(formData.roll),
        class: parseInt(formData.class),
        section: isHighClass ? formData.group : formData.section,
        group: isHighClass ? formData.group : undefined,
      };

      await db.students.update(originalStudent!.id!, updatedStudent);
      toast.success("Student updated successfully!");

      // Navigate to students list
      navigate("/students");
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Failed to update student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rollNumbers = Array.from({ length: 200 }, (_, i) => i + 1);
  const classes = [6, 7, 8, 9, 10];
  const sections = ["A", "B"];

  const selectedClass = parseInt(formData.class);
  const isHighClass = selectedClass >= 9 && selectedClass <= 10;
  const groups = getGroups(selectedClass);

  const handleClassChange = (value: string) => {
    setFormData({
      ...formData,
      class: value,
      section: "",
      group: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading student...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✏️ Edit Student
          </CardTitle>
          <CardDescription>
            Edit student information in GUZIA HIGH SCHOOL system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Student Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter student's full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roll">Roll Number *</Label>
              <Select
                value={formData.roll}
                onValueChange={(value) =>
                  setFormData({ ...formData, roll: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select roll number" />
                </SelectTrigger>
                <SelectContent>
                  {rollNumbers.map((roll) => (
                    <SelectItem key={roll} value={roll.toString()}>
                      {roll}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={formData.class} onValueChange={handleClassChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls.toString()}>
                      Class {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isHighClass ? (
              <div className="space-y-2">
                <Label htmlFor="group">Group *</Label>
                <Select
                  value={formData.group}
                  onValueChange={(value) =>
                    setFormData({ ...formData, group: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="section">Section *</Label>
                <Select
                  value={formData.section}
                  onValueChange={(value) =>
                    setFormData({ ...formData, section: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Updating..." : "Update Student"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/students")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
