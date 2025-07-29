import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  db,
  Student,
  Mark,
  calculateGrade,
  getSubjectsByClassAndGroup,
  getGroups,
  getSubjectMarkingScheme,
} from "@/lib/database";
import { Save, ArrowLeft } from "lucide-react";

interface StudentMark {
  studentId: number;
  studentName: string;
  roll: number;
  theory: number;
  mcq: number;
  practical: number;
}

export function MarkEntry() {
  const [step, setStep] = useState(1);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [studentMarks, setStudentMarks] = useState<StudentMark[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load students when class and section/group are selected
  useEffect(() => {
    const classNum = parseInt(selectedClass);
    const isHighClass = classNum >= 9 && classNum <= 10;

    if (
      selectedClass &&
      ((isHighClass && selectedGroup) || (!isHighClass && selectedSection))
    ) {
      loadStudents();
    }
  }, [
    selectedClass,
    selectedSection,
    selectedGroup,
    selectedSubject,
    selectedExam,
  ]);

  // Update subjects when class and group change
  useEffect(() => {
    if (selectedClass) {
      const classNum = parseInt(selectedClass);
      setGroups(getGroups(classNum));

      if (classNum >= 6 && classNum <= 8) {
        // For classes 6-8, no group selection needed
        setSubjects(getSubjectsByClassAndGroup(classNum));
        setSelectedGroup("");
      } else if (classNum >= 9 && classNum <= 10 && selectedGroup) {
        setSubjects(getSubjectsByClassAndGroup(classNum, selectedGroup));
      } else if (classNum >= 9 && classNum <= 10) {
        setSubjects([]);
      }
    }
  }, [selectedClass, selectedGroup]);

  const loadStudents = async () => {
    const classNum = parseInt(selectedClass);
    const isHighClass = classNum >= 9 && classNum <= 10;

    if (
      !selectedClass ||
      (!isHighClass && !selectedSection) ||
      (isHighClass && !selectedGroup)
    )
      return;

    setLoading(true);
    try {
      const searchCriteria: any = {
        class: classNum,
      };

      if (isHighClass) {
        searchCriteria.group = selectedGroup;
      } else {
        searchCriteria.section = selectedSection;
      }

      const classStudents = await db.students
        .filter((student) => {
          if (isHighClass) {
            return (
              student.class === classNum && student.group === selectedGroup
            );
          } else {
            return (
              student.class === classNum && student.section === selectedSection
            );
          }
        })
        .toArray();
      classStudents.sort((a, b) => a.roll - b.roll);

      setStudents(classStudents);

      // Initialize student marks with existing data if available
      const initialMarks: StudentMark[] = await Promise.all(
        classStudents.map(async (student) => {
          // If subject and exam are selected, try to load existing marks
          if (selectedSubject && selectedExam) {
            const existingMark = await db.marks
              .where({
                studentId: student.id,
                subject: selectedSubject,
                exam: selectedExam,
              })
              .first();

            if (existingMark) {
              return {
                studentId: student.id!,
                studentName: student.name,
                roll: student.roll,
                theory: existingMark.theory || 0,
                mcq: existingMark.mcq || 0,
                practical: existingMark.practical || 0,
              };
            }
          }

          // Default to zero marks if no existing data
          return {
            studentId: student.id!,
            studentName: student.name,
            roll: student.roll,
            theory: 0,
            mcq: 0,
            practical: 0,
          };
        }),
      );

      setStudentMarks(initialMarks);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (
    studentId: number,
    field: keyof StudentMark,
    value: string,
  ) => {
    const numValue = parseInt(value) || 0;
    setStudentMarks((prev) =>
      prev.map((mark) =>
        mark.studentId === studentId ? { ...mark, [field]: numValue } : mark,
      ),
    );
  };

  const calculateTotal = (
    theory: number,
    mcq: number,
    practical: number,
  ): number => {
    return theory + mcq + practical;
  };

  // Get marking scheme for selected subject
  const markingScheme = selectedSubject
    ? getSubjectMarkingScheme(selectedSubject, parseInt(selectedClass))
    : null;

  const handleSaveMarks = async () => {
  setSaving(true);
  try {
    // Get the marking scheme for the selected subject
    const scheme = getSubjectMarkingScheme(selectedSubject, parseInt(selectedClass));
    const validationErrors: string[] = [];

    // Validate marks against marking scheme
    studentMarks.forEach((studentMark) => {
      if (scheme.written > 0 && studentMark.theory > scheme.written) {
        validationErrors.push(
          `${studentMark.studentName}: Written marks (${studentMark.theory}) exceed maximum (${scheme.written})`,
        );
      }
      if (scheme.mcq > 0 && studentMark.mcq > scheme.mcq) {
        validationErrors.push(
          `${studentMark.studentName}: MCQ marks (${studentMark.mcq}) exceed maximum (${scheme.mcq})`,
        );
      }
      if (scheme.practical > 0 && studentMark.practical > scheme.practical) {
        validationErrors.push(
          `${studentMark.studentName}: Practical marks (${studentMark.practical}) exceed maximum (${scheme.practical})`,
        );
      }
    });

    if (validationErrors.length > 0) {
      toast.error(`Validation errors:\n${validationErrors.join("\n")}`);
      return;
    }

    // Prepare marks to be saved
    const marksToSave: Partial<Mark>[] = studentMarks.map((studentMark) => {
      // Calculate total marks based on theory, mcq, and practical marks
      const total = calculateTotal(
        studentMark.theory,
        studentMark.mcq,
        studentMark.practical,
      );

      // Calculate the grade and gradePoint based on the total and marking scheme
      const percentage = (total / scheme.total) * 100;
      const { grade, gradePoint } = calculateGrade(percentage, scheme.total);

      const isHighClass =
        parseInt(selectedClass) >= 9 && parseInt(selectedClass) <= 10;

      return {
        studentId: studentMark.studentId,
        subject: selectedSubject,
        exam: selectedExam,
        class: parseInt(selectedClass),
        section: isHighClass ? selectedGroup : selectedSection,
        group: isHighClass ? selectedGroup : undefined,
        theory: studentMark.theory,
        mcq: studentMark.mcq,
        practical: studentMark.practical,
        total,
        grade,
        gradePoint,
      };
    });

    // Check if marks already exist and update or create
    for (const mark of marksToSave) {
      const existingMark = await db.marks
        .where({
          studentId: mark.studentId,
          subject: mark.subject,
          exam: mark.exam,
        })
        .first();

      if (existingMark) {
        await db.marks.update(existingMark.id!, mark);
      } else {
        await db.marks.add(mark as Mark);
      }
    }

    toast.success("Marks saved successfully!");

    // Reset form
    setStep(1);
    setSelectedExam("");
    setSelectedClass("");
    setSelectedSection("");
    setSelectedGroup("");
    setSelectedSubject("");
    setStudents([]);
    setStudentMarks([]);
  } catch (error) {
    console.error("Error saving marks:", error);
    toast.error("Failed to save marks");
  } finally {
    setSaving(false);
  }
};


  const resetForm = () => {
    setStep(1);
    setSelectedExam("");
    setSelectedClass("");
    setSelectedSection("");
    setSelectedGroup("");
    setSelectedSubject("");
    setStudents([]);
    setStudentMarks([]);
  };

  const canProceedToStep2 = () => {
    const classNum = parseInt(selectedClass);
    const isHighClass = classNum >= 9 && classNum <= 10;

    return (
      selectedExam &&
      selectedClass &&
      ((isHighClass && selectedGroup) || (!isHighClass && selectedSection))
    );
  };

  const canProceedToStep3 = canProceedToStep2() && selectedSubject;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">📝 Mark Entry</h1>
          <p className="text-muted-foreground">
            Enter marks for students by subject and exam
          </p>
        </div>
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      {/* Step Indicators */}
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNum
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {stepNum}
            </div>
            <span className="ml-2 text-sm">
              {stepNum === 1 && "Select Criteria"}
              {stepNum === 2 && "Choose Subject"}
              {stepNum === 3 && "Enter Marks"}
            </span>
            {stepNum < 3 && <div className="ml-4 w-8 h-0.5 bg-muted" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Exam, Class, Section, Group */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Exam Criteria</CardTitle>
            <CardDescription>
              Choose the exam, class, section, and group (if applicable)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="exam">Exam *</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Half-Yearly">Half-Yearly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 7, 8, 9, 10].map((cls) => (
                      <SelectItem key={cls} value={cls.toString()}>
                        Class {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {parseInt(selectedClass) >= 9 && parseInt(selectedClass) <= 10 ? (
                <div className="space-y-2">
                  <Label htmlFor="group">Group *</Label>
                  <Select
                    value={selectedGroup}
                    onValueChange={setSelectedGroup}
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
                    value={selectedSection}
                    onValueChange={setSelectedSection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Section A</SelectItem>
                      <SelectItem value="B">Section B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2()}
              className="w-full"
            >
              Next: Choose Subject
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Subject */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Select Subject</CardTitle>
            <CardDescription>Choose the subject for mark entry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Badge variant="outline">Exam: {selectedExam}</Badge>
              </div>
              <div>
                <Badge variant="outline">Class: {selectedClass}</Badge>
              </div>
              {parseInt(selectedClass) >= 9 && parseInt(selectedClass) <= 10 ? (
                <div>
                  <Badge variant="outline">Group: {selectedGroup}</Badge>
                </div>
              ) : (
                <div>
                  <Badge variant="outline">Section: {selectedSection}</Badge>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Label>Subject *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {subjects.map((subject) => (
                  <Button
                    key={subject}
                    variant={
                      selectedSubject === subject ? "default" : "outline"
                    }
                    onClick={() => setSelectedSubject(subject)}
                    className="h-auto p-4 text-left justify-start"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{subject}</span>
                      {selectedSubject === subject && (
                        <span className="text-xs opacity-75 mt-1">
                          Selected
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
              {subjects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Please select exam, class, and group first to see available
                  subjects.
                </div>
              )}
            </div>

            <Button
              onClick={() => setStep(3)}
              disabled={!canProceedToStep3}
              className="w-full"
            >
              Next: Enter Marks
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Enter Marks */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Enter Marks</CardTitle>
            <CardDescription>
              Enter theory, MCQ, and practical marks for each student
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Badge variant="outline">Exam: {selectedExam}</Badge>
              <Badge variant="outline">Class: {selectedClass}</Badge>
              {parseInt(selectedClass) >= 9 && parseInt(selectedClass) <= 10 ? (
                <Badge variant="outline">Group: {selectedGroup}</Badge>
              ) : (
                <Badge variant="outline">Section: {selectedSection}</Badge>
              )}
              <Badge variant="outline">Subject: {selectedSubject}</Badge>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading students...</div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  No students found for the selected criteria.
                </div>
                <Button variant="outline" onClick={resetForm} className="mt-4">
                  Start Over
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll</TableHead>
                        <TableHead>Student Name</TableHead>
                        {markingScheme && markingScheme.written > 0 && (
                          <TableHead>
                            Written ({markingScheme.written})
                          </TableHead>
                        )}
                        {markingScheme && markingScheme.mcq > 0 && (
                          <TableHead>MCQ ({markingScheme.mcq})</TableHead>
                        )}
                        {markingScheme && markingScheme.practical > 0 && (
                          <TableHead>
                            Practical ({markingScheme.practical})
                          </TableHead>
                        )}
                        <TableHead>
                          Total ({markingScheme?.total || 100})
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentMarks.map((studentMark) => {
                        const total = calculateTotal(
                          studentMark.theory,
                          studentMark.mcq,
                          studentMark.practical,
                        );
                        return (
                          <TableRow key={studentMark.studentId}>
                            <TableCell>
                              <Badge variant="outline">
                                {studentMark.roll}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {studentMark.studentName}
                            </TableCell>
                            {markingScheme && markingScheme.written > 0 && (
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max={markingScheme.written}
                                  value={studentMark.theory}
                                  onChange={(e) =>
                                    handleMarkChange(
                                      studentMark.studentId,
                                      "theory",
                                      e.target.value,
                                    )
                                  }
                                  className="w-20"
                                />
                              </TableCell>
                            )}
                            {markingScheme && markingScheme.mcq > 0 && (
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max={markingScheme.mcq}
                                  value={studentMark.mcq}
                                  onChange={(e) =>
                                    handleMarkChange(
                                      studentMark.studentId,
                                      "mcq",
                                      e.target.value,
                                    )
                                  }
                                  className="w-20"
                                />
                              </TableCell>
                            )}
                            {markingScheme && markingScheme.practical > 0 && (
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max={markingScheme.practical}
                                  value={studentMark.practical}
                                  onChange={(e) =>
                                    handleMarkChange(
                                      studentMark.studentId,
                                      "practical",
                                      e.target.value,
                                    )
                                  }
                                  className="w-20"
                                />
                              </TableCell>
                            )}
                            <TableCell>
                              <Badge variant="secondary">{total}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetForm}>
                    Start Over
                  </Button>
                  <Button onClick={handleSaveMarks} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save Marks"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}