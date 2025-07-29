import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
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
import { Download, FileText, Users, GraduationCap, Upload, Table as TableIcon } from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import {
  db,
  Student,
  Mark,
  getSubjectsByClassAndGroup,
  getGroups,
} from "@/lib/database";
import { MarksheetTemplate } from "@/components/MarksheetTemplate";
import { FinalMarksheetTemplate } from "@/components/FinalMarksheetTemplate";
import { TabulationSheet } from "@/components/TabulationSheet";

export interface StudentMarksheet {
  student: Student;
  marks: Mark[];
  gpa: number;
  totalGradePoints: number;
  subjects: number;
  sectionRank?: number;
  totalStudentsInSection?: number;
}

export function Marksheet() {
  const [mode, setMode] = useState<"individual" | "section" | "final" | "tabulation" | "">("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedRoll, setSelectedRoll] = useState("");
  const [selectedExam, setSelectedExam] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [studentMarksheet, setStudentMarksheet] =
    useState<StudentMarksheet | null>(null);
  const [sectionMarksheets, setSectionMarksheets] = useState<
    StudentMarksheet[]
  >([]);
  const [finalMarksheets, setFinalMarksheets] = useState<
    {
      marksheet: StudentMarksheet;
      halfYearlyMarks: Mark[];
      yearlyMarks: Mark[];
    }[]
  >([]);
  const [tabulationData, setTabulationData] = useState<{
    students: Student[];
    subjects: string[];
    marksMatrix: { [studentId: number]: { [subject: string]: Mark | null } };
    totals: { [studentId: number]: number };
    grades: { [studentId: number]: string };
    positions: { [studentId: number]: number };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const marksheetRef = useRef<HTMLDivElement>(null);

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
  }, [selectedClass, selectedSection, selectedGroup]);

  const loadStudents = async () => {
    const classNum = parseInt(selectedClass);
    const isHighClass = classNum >= 9 && classNum <= 10;

    if (
      !selectedClass ||
      (!isHighClass && !selectedSection) ||
      (isHighClass && !selectedGroup)
    )
      return;

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
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    }
  };

  const calculateGPA = (marks: Mark[]): number => {
    if (marks.length === 0) return 0;

    const totalGradePoints = marks.reduce(
      (sum, mark) => sum + mark.gradePoint,
      0,
    );
    return totalGradePoints / marks.length;
  };

  const loadIndividualMarksheet = async () => {
    const classNum = parseInt(selectedClass);
    const isHighClass = classNum >= 9 && classNum <= 10;

    if (
      !selectedClass ||
      !selectedRoll ||
      !selectedExam ||
      (!isHighClass && !selectedSection) ||
      (isHighClass && !selectedGroup)
    ) {
      return;
    }

    setLoading(true);
    try {
      const searchCriteria: any = {
        class: classNum,
        roll: parseInt(selectedRoll),
      };

      if (isHighClass) {
        searchCriteria.group = selectedGroup;
      } else {
        searchCriteria.section = selectedSection;
      }

      const students = await db.students
        .filter((student) => {
          if (isHighClass) {
            return (
              student.class === classNum &&
              student.roll === parseInt(selectedRoll) &&
              student.group === selectedGroup
            );
          } else {
            return (
              student.class === classNum &&
              student.roll === parseInt(selectedRoll) &&
              student.section === selectedSection
            );
          }
        })
        .toArray();
      const student = students[0];

      if (!student) {
        toast.error("Student not found");
        return;
      }

      // Get all students in the same section/group for ranking
      const sectionSearchCriteria: any = {
        class: classNum,
      };

      if (isHighClass) {
        sectionSearchCriteria.group = selectedGroup;
      } else {
        sectionSearchCriteria.section = selectedSection;
      }

      const sectionStudents = await db.students
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

      // Get student's marks
      const studentMarks = await db.marks
        .where({
          studentId: student.id,
          exam: selectedExam,
        })
        .toArray();

      // Get all possible subjects for this class/group
      const allSubjects = getSubjectsByClassAndGroup(
        parseInt(selectedClass),
        studentMarks.find((m) => m.group)?.group,
      );

      // Create complete marks array with 0 for missing subjects
      const completeMarks: Mark[] = allSubjects.map((subject) => {
        const existingMark = studentMarks.find((m) => m.subject === subject);
        if (existingMark) {
          return existingMark;
        }

        // Create default mark entry for unenterd subjects
        return {
          studentId: student.id!,
          subject,
          exam: selectedExam,
          class: parseInt(selectedClass),
          section: selectedSection,
          group: studentMarks.find((m) => m.group)?.group,
          theory: 0,
          mcq: 0,
          practical: 0,
          total: 0,
          grade: "F",
          gradePoint: 0.0,
        } as Mark;
      });

      // Calculate GPA and ranking
      const enteredMarks = studentMarks.filter((m) => m.total > 0);
      const gpa = calculateGPA(enteredMarks);
      const totalGradePoints = enteredMarks.reduce(
        (sum, mark) => sum + mark.gradePoint,
        0,
      );

      // Calculate section ranking based on total marks
      const sectionTotalMarks = await Promise.all(
        sectionStudents.map(async (s) => {
          const sMarks = await db.marks
            .where({
              studentId: s.id,
              exam: selectedExam,
            })
            .toArray();
          const sEnteredMarks = sMarks.filter((m) => m.total > 0);
          const totalMarks = sEnteredMarks.reduce(
            (sum, mark) => sum + mark.total,
            0,
          );
          return {
            studentId: s.id,
            totalMarks,
            gpa: calculateGPA(sEnteredMarks),
          };
        }),
      );

      // Sort by total marks descending to get ranking
      const sortedByTotalMarks = sectionTotalMarks
        .filter((s) => s.totalMarks > 0)
        .sort((a, b) => b.totalMarks - a.totalMarks);

      const sectionRank =
        sortedByTotalMarks.findIndex((s) => s.studentId === student.id) + 1;

      setStudentMarksheet({
        student,
        marks: completeMarks,
        gpa,
        totalGradePoints,
        subjects: allSubjects.length,
        sectionRank: sectionRank || undefined,
        totalStudentsInSection: sortedByTotalMarks.length,
      });
    } catch (error) {
      console.error("Error loading marksheet:", error);
      toast.error("Failed to load marksheet");
    } finally {
      setLoading(false);
    }
  };

  const loadSectionMarksheets = async () => {
    const classNum = parseInt(selectedClass);
    const isHighClass = classNum >= 9 && classNum <= 10;

    if (
      !selectedClass ||
      !selectedExam ||
      (!isHighClass && !selectedSection) ||
      (isHighClass && !selectedGroup)
    ) {
      return;
    }

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

      const marksheets: StudentMarksheet[] = [];

      // Get all students' marks first for ranking calculation
      const allStudentGPAs = [];

      for (const student of classStudents) {
        const studentMarks = await db.marks
          .where({
            studentId: student.id,
            exam: selectedExam,
          })
          .toArray();

        // Get all possible subjects for this class/group
        const allSubjects = getSubjectsByClassAndGroup(
          parseInt(selectedClass),
          studentMarks.find((m) => m.group)?.group,
        );

        // Create complete marks array with 0 for missing subjects
        const completeMarks: Mark[] = allSubjects.map((subject) => {
          const existingMark = studentMarks.find((m) => m.subject === subject);
          if (existingMark) {
            return existingMark;
          }

          // Create default mark entry for unenterd subjects
          return {
            studentId: student.id!,
            subject,
            exam: selectedExam,
            class: parseInt(selectedClass),
            section: selectedSection,
            group: studentMarks.find((m) => m.group)?.group,
            theory: 0,
            mcq: 0,
            practical: 0,
            total: 0,
            grade: "F",
            gradePoint: 0.0,
          } as Mark;
        });

        const enteredMarks = studentMarks.filter((m) => m.total > 0);
        const gpa = calculateGPA(enteredMarks);
        const totalGradePoints = enteredMarks.reduce(
          (sum, mark) => sum + mark.gradePoint,
          0,
        );

        allStudentGPAs.push({
          studentId: student.id,
          gpa,
        });

        marksheets.push({
          student,
          marks: completeMarks,
          gpa,
          totalGradePoints,
          subjects: allSubjects.length,
        });
      }

      // Calculate rankings based on total marks
      const allStudentTotals = allStudentGPAs.map((student) => {
        const studentMarksheet = marksheets.find(
          (m) => m.student.id === student.studentId,
        );
        const totalMarks = studentMarksheet
          ? studentMarksheet.marks.reduce((sum, mark) => sum + mark.total, 0)
          : 0;
        return {
          studentId: student.studentId,
          totalMarks,
          gpa: student.gpa,
        };
      });

      const sortedByTotalMarks = allStudentTotals
        .filter((s) => s.totalMarks > 0)
        .sort((a, b) => b.totalMarks - a.totalMarks);

      // Add ranking to each marksheet
      const rankedMarksheets = marksheets.map((marksheet) => {
        const rank =
          sortedByTotalMarks.findIndex(
            (s) => s.studentId === marksheet.student.id,
          ) + 1;
        return {
          ...marksheet,
          sectionRank: rank || undefined,
          totalStudentsInSection: sortedByTotalMarks.length,
        };
      });

      setSectionMarksheets(rankedMarksheets);
    } catch (error) {
      console.error("Error loading section marksheets:", error);
      toast.error("Failed to load section marksheets");
    } finally {
      setLoading(false);
    }
  };

  const loadFinalMarksheets = async () => {
    const classNum = parseInt(selectedClass);
    const isHighClass = classNum >= 9 && classNum <= 10;

    if (
      !selectedClass ||
      (!isHighClass && !selectedSection) ||
      (isHighClass && !selectedGroup)
    ) {
      return;
    }

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

      // Get students
      let classStudents = await db.students
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

      // Filter by roll if specified
      if (selectedRoll && selectedRoll !== "all") {
        classStudents = classStudents.filter(
          (student) => student.roll === parseInt(selectedRoll),
        );
      }

      classStudents.sort((a, b) => a.roll - b.roll);

      const finalMarksheets: {
        marksheet: StudentMarksheet;
        halfYearlyMarks: Mark[];
        yearlyMarks: Mark[];
        totalMarks: number;
        finalGPA: number;
      }[] = [];

      for (const student of classStudents) {
        // Get half-yearly marks
        const halfYearlyMarks = await db.marks
          .where({
            studentId: student.id,
            exam: "Half-Yearly",
          })
          .toArray();

        // Get yearly marks
        const yearlyMarks = await db.marks
          .where({
            studentId: student.id,
            exam: "Yearly",
          })
          .toArray();

        // Get all possible subjects for this class/group
        const allSubjects = getSubjectsByClassAndGroup(
          parseInt(selectedClass),
          isHighClass ? student.group : undefined,
        );

        // Create default marks for missing subjects in each exam
        const completeHalfYearlyMarks: Mark[] = allSubjects.map((subject) => {
          const existingMark = halfYearlyMarks.find(
            (m) => m.subject === subject,
          );
          if (existingMark) {
            return existingMark;
          }
          // Create default mark with 0 values
          return {
            studentId: student.id!,
            subject,
            exam: "Half-Yearly",
            class: parseInt(selectedClass),
            section: selectedSection,
            group: isHighClass ? student.group : undefined,
            theory: 0,
            mcq: 0,
            practical: 0,
            total: 0,
            grade: "F",
            gradePoint: 0.0,
          } as Mark;
        });

        const completeYearlyMarks: Mark[] = allSubjects.map((subject) => {
          const existingMark = yearlyMarks.find((m) => m.subject === subject);
          if (existingMark) {
            return existingMark;
          }
          // Create default mark with 0 values
          return {
            studentId: student.id!,
            subject,
            exam: "Yearly",
            class: parseInt(selectedClass),
            section: selectedSection,
            group: isHighClass ? student.group : undefined,
            theory: 0,
            mcq: 0,
            practical: 0,
            total: 0,
            grade: "F",
            gradePoint: 0.0,
          } as Mark;
        });

        // Calculate totals and final GPA using complete marks (including defaults)
        const halfYearlyTotal = completeHalfYearlyMarks.reduce(
          (sum, mark) => sum + mark.total,
          0,
        );
        const yearlyTotal = completeYearlyMarks.reduce(
          (sum, mark) => sum + mark.total,
          0,
        );
        const totalMarks = halfYearlyTotal + yearlyTotal;

        const halfYearlyGPA =
          completeHalfYearlyMarks.reduce(
            (sum, mark) => sum + mark.gradePoint,
            0,
          ) / completeHalfYearlyMarks.length;
        const yearlyGPA =
          completeYearlyMarks.reduce((sum, mark) => sum + mark.gradePoint, 0) /
          completeYearlyMarks.length;
        const finalGPA = (halfYearlyGPA + yearlyGPA) / 2;

        // Create marksheet data
        const marksheet: StudentMarksheet = {
          student,
          marks: [...completeHalfYearlyMarks, ...completeYearlyMarks], // Combined for general use
          gpa: finalGPA,
          totalGradePoints: finalGPA * allSubjects.length,
          subjects: allSubjects.length,
        };

        finalMarksheets.push({
          marksheet,
          halfYearlyMarks: completeHalfYearlyMarks,
          yearlyMarks: completeYearlyMarks,
          totalMarks,
          finalGPA,
        });
      }

      // Sort by total marks first, then by GPA for ranking
      finalMarksheets.sort((a, b) => {
        if (b.totalMarks !== a.totalMarks) {
          return b.totalMarks - a.totalMarks; // Higher total marks first
        }
        return b.finalGPA - a.finalGPA; // If same total marks, higher GPA first
      });

      // Add ranking to each marksheet
      const rankedFinalMarksheets = finalMarksheets.map((data, index) => ({
        marksheet: {
          ...data.marksheet,
          sectionRank: index + 1,
          totalStudentsInSection: finalMarksheets.length,
        },
        halfYearlyMarks: data.halfYearlyMarks,
        yearlyMarks: data.yearlyMarks,
      }));

      setFinalMarksheets(rankedFinalMarksheets);
    } catch (error) {
      console.error("Error loading final marksheets:", error);
      toast.error("Failed to load final marksheets");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!marksheetRef.current) return;

    setGenerating(true);
    try {
      // Use landscape orientation for tabulation sheets
      const pdf = mode === "tabulation"
        ? new jsPDF("l", "mm", "a4")  // landscape
        : new jsPDF("p", "mm", "a4"); // portrait

      if (mode === "individual") {
        // For individual marksheet, maintain natural aspect ratio
        const canvas = await html2canvas(marksheetRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm

        // Calculate natural image dimensions while maintaining aspect ratio
        const imgAspectRatio = canvas.width / canvas.height;
        const maxWidth = pageWidth - 20; // Leave 10mm margin on each side
        const maxHeight = pageHeight - 20; // Leave 10mm margin top and bottom

        let imgWidth = maxWidth;
        let imgHeight = maxWidth / imgAspectRatio;

        // If height exceeds max height, scale down
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = maxHeight * imgAspectRatio;
        }

        // Center the image on the page
        const xOffset = (pageWidth - imgWidth) / 2;
        const yOffset = (pageHeight - imgHeight) / 2;

        pdf.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);
      } else if (mode === "tabulation") {
        // For tabulation sheet in landscape mode - handle multiple pages
        const tabulationPages = marksheetRef.current.querySelectorAll(
          ".tabulation-page",
        );

        for (let i = 0; i < tabulationPages.length; i++) {
          const element = tabulationPages[i] as HTMLElement;

          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
          });

          const imgData = canvas.toDataURL("image/png");
          const pageWidth = 297; // A4 landscape width
          const pageHeight = 210; // A4 landscape height

          // Calculate natural image dimensions while maintaining aspect ratio
          const imgAspectRatio = canvas.width / canvas.height;
          const maxWidth = pageWidth - 20; // Leave 10mm margin on each side
          const maxHeight = pageHeight - 20; // Leave 10mm margin top and bottom

          let imgWidth = maxWidth;
          let imgHeight = maxWidth / imgAspectRatio;

          // If height exceeds max height, scale down
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = maxHeight * imgAspectRatio;
          }

          // Center the image on the page
          const xOffset = (pageWidth - imgWidth) / 2;
          const yOffset = (pageHeight - imgHeight) / 2;

          if (i > 0) {
            pdf.addPage("a4", "landscape");
          }

          pdf.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);
        }
      } else {
        // For section-wise marksheets, process each marksheet individually
        const marksheetElements = marksheetRef.current.querySelectorAll(
          ".individual-marksheet",
        );

        for (let i = 0; i < marksheetElements.length; i++) {
          const element = marksheetElements[i] as HTMLElement;

          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
          });

          const imgData = canvas.toDataURL("image/png");
          const pageWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm

          // Calculate natural image dimensions while maintaining aspect ratio
          const imgAspectRatio = canvas.width / canvas.height;
          const maxWidth = pageWidth - 20; // Leave 10mm margin on each side
          const maxHeight = pageHeight - 20; // Leave 10mm margin top and bottom

          let imgWidth = maxWidth;
          let imgHeight = maxWidth / imgAspectRatio;

          // If height exceeds max height, scale down
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = maxHeight * imgAspectRatio;
          }

          // Center the image on the page
          const xOffset = (pageWidth - imgWidth) / 2;
          const yOffset = (pageHeight - imgHeight) / 2;

          if (i > 0) {
            pdf.addPage();
          }

          pdf.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);
        }
      }

      const fileName =
        mode === "individual"
          ? `marksheet_${studentMarksheet?.student.name}_${selectedExam}.pdf`
          : mode === "final"
            ? `final_marksheet_class${selectedClass}_${parseInt(selectedClass) >= 9 && parseInt(selectedClass) <= 10 ? "group" + selectedGroup.replace(/\s+/g, "") : "section" + selectedSection}.pdf`
            : mode === "tabulation"
              ? `tabulation_sheet_class${selectedClass}_${parseInt(selectedClass) >= 9 && parseInt(selectedClass) <= 10 ? "group" + selectedGroup.replace(/\s+/g, "") : "section" + selectedSection}_${selectedExam}.pdf`
              : `marksheet_class${selectedClass}_${parseInt(selectedClass) >= 9 && parseInt(selectedClass) <= 10 ? "group" + selectedGroup.replace(/\s+/g, "") : "section" + selectedSection}_${selectedExam}.pdf`;

      pdf.save(fileName);
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  const loadTabulationData = async () => {
    const classNum = parseInt(selectedClass);
    const isHighClass = classNum >= 9 && classNum <= 10;

    if (
      !selectedClass ||
      !selectedExam ||
      (!isHighClass && !selectedSection) ||
      (isHighClass && !selectedGroup)
    ) {
      return;
    }

    setLoading(true);
    try {
      // Get students in the section/group
      const students = await db.students
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
      students.sort((a, b) => a.roll - b.roll);

      // Get all subjects for this class/group
      const subjects = getSubjectsByClassAndGroup(
        classNum,
        isHighClass ? selectedGroup : undefined,
      );

      // Create marks matrix
      const marksMatrix: { [studentId: number]: { [subject: string]: Mark | null } } = {};
      const totals: { [studentId: number]: number } = {};
      const grades: { [studentId: number]: string } = {};

      for (const student of students) {
        marksMatrix[student.id!] = {};
        let studentTotal = 0;
        let totalSubjects = 0;
        let totalGradePoints = 0;

        for (const subject of subjects) {
          // Get mark for this student and subject
          const mark = await db.marks
            .where({
              studentId: student.id,
              subject: subject,
              exam: selectedExam,
            })
            .first();

          if (mark) {
            marksMatrix[student.id!][subject] = mark;
            studentTotal += mark.total;
            totalGradePoints += mark.gradePoint;
            totalSubjects++;
          } else {
            // Create default mark if not exists
            marksMatrix[student.id!][subject] = {
              studentId: student.id!,
              subject,
              exam: selectedExam,
              class: classNum,
              section: selectedSection,
              group: isHighClass ? selectedGroup : undefined,
              theory: 0,
              mcq: 0,
              practical: 0,
              total: 0,
              grade: "F",
              gradePoint: 0.0,
            } as Mark;
          }
        }

        totals[student.id!] = studentTotal;

        // Check if any subject has "F" grade - if so, final grade is "F"
        let hasFailedSubject = false;
        for (const subject of subjects) {
          const mark = marksMatrix[student.id!]?.[subject];
          if (mark && mark.grade === "F") {
            hasFailedSubject = true;
            break;
          }
        }

        if (hasFailedSubject) {
          grades[student.id!] = "F";
        } else {
          // Calculate overall grade based on average GPA only if no subject is failed
          const avgGPA = totalSubjects > 0 ? totalGradePoints / totalSubjects : 0;
          if (avgGPA >= 5.0) grades[student.id!] = "A+";
          else if (avgGPA >= 4.0) grades[student.id!] = "A";
          else if (avgGPA >= 3.5) grades[student.id!] = "A-";
          else if (avgGPA >= 3.0) grades[student.id!] = "B";
          else if (avgGPA >= 2.0) grades[student.id!] = "C";
          else if (avgGPA >= 1.0) grades[student.id!] = "D";
          else grades[student.id!] = "F";
        }
      }

      // Calculate positions based on total marks
      const sortedByTotal = students
        .map((student) => ({
          studentId: student.id!,
          total: totals[student.id!],
        }))
        .sort((a, b) => b.total - a.total);

      const positions: { [studentId: number]: number } = {};
      sortedByTotal.forEach((item, index) => {
        positions[item.studentId] = index + 1;
      });

      setTabulationData({
        students,
        subjects,
        marksMatrix,
        totals,
        grades,
        positions,
      });
    } catch (error) {
      console.error("Error loading tabulation data:", error);
      toast.error("Failed to load tabulation data");
    } finally {
      setLoading(false);
    }
  };

  const downloadAllData = async () => {
    try {
      // Get all students
      const allStudents = await db.students.orderBy("roll").toArray();

      // Get all marks
      const allMarks = await db.marks.toArray();
      console.log("Total students:", allStudents.length);
      console.log("Total marks:", allMarks.length);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Student data sheet
      const studentData = allStudents.map((student) => ({
        ID: student.id,
        Name: student.name,
        Roll: student.roll,
        Class: student.class,
        Section: student.section || "",
        Group: student.group || "",
      }));

      const studentSheet = XLSX.utils.json_to_sheet(studentData);
      XLSX.utils.book_append_sheet(wb, studentSheet, "Students");

      // Enhanced marks data sheet with better handling
      if (allMarks.length > 0) {
        const marksData = allMarks.map((mark) => ({
          ID: mark.id,
          StudentID: mark.studentId,
          Subject: mark.subject,
          Exam: mark.exam,
          Class: mark.class,
          Section: mark.section || "",
          Group: mark.group || "",
          Theory: mark.theory || 0,
          MCQ: mark.mcq || 0,
          Practical: mark.practical || 0,
          Total: mark.total || 0,
          Grade: mark.grade || "F",
          GradePoint: mark.gradePoint || 0.0,
        }));

        const marksSheet = XLSX.utils.json_to_sheet(marksData);
        XLSX.utils.book_append_sheet(wb, marksSheet, "Marks");
      } else {
        // Create empty marks sheet with headers if no marks exist
        const emptyMarksData = [
          {
            ID: "",
            StudentID: "",
            Subject: "",
            Exam: "",
            Class: "",
            Section: "",
            Group: "",
            Theory: "",
            MCQ: "",
            Practical: "",
            Total: "",
            Grade: "",
            GradePoint: "",
          },
        ];
        const marksSheet = XLSX.utils.json_to_sheet(emptyMarksData);
        XLSX.utils.book_append_sheet(wb, marksSheet, "Marks");
      }

      // Generate filename
      const filename = `GUZIA_HIGH_SCHOOL_Complete_Data_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast.success(
        `All data exported successfully! ${allStudents.length} students and ${allMarks.length} marks included.`,
      );
    } catch (error) {
      console.error("Error exporting all data:", error);
      toast.error("Failed to export all data");
    }
  };

  const uploadAllData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "buffer" });

      // Check if required sheets exist
      if (
        !workbook.SheetNames.includes("Students") ||
        !workbook.SheetNames.includes("Marks")
      ) {
        toast.error("Invalid file format. Required sheets: Students and Marks");
        return;
      }

      // Parse students data
      const studentsSheet = workbook.Sheets["Students"];
      const studentsData = XLSX.utils.sheet_to_json(studentsSheet) as any[];

      // Parse marks data
      const marksSheet = workbook.Sheets["Marks"];
      const marksData = XLSX.utils.sheet_to_json(marksSheet) as any[];

      let studentsImported = 0;
      let marksImported = 0;

      // Import students
      for (const row of studentsData) {
        try {
          if (!row.Name || !row.Roll || !row.Class) continue;

          const rollNum = parseInt(row.Roll?.toString());
          const classNum = parseInt(row.Class?.toString());

          if (isNaN(rollNum) || isNaN(classNum)) {
            console.warn("Invalid roll or class number:", row);
            continue;
          }

          const student: Student = {
            id: row.ID || undefined,
            name: row.Name.toString().trim(),
            roll: rollNum,
            class: classNum,
            section: row.Section?.toString().trim() || "",
            group: row.Group?.toString().trim() || undefined,
          };

          // Check if student already exists by roll, class, and section/group
          const existingStudents = await db.students
            .filter(
              (s) =>
                s.roll === student.roll &&
                s.class === student.class &&
                ((student.group && s.group === student.group) ||
                  (!student.group && s.section === student.section)),
            )
            .toArray();

          if (existingStudents.length > 0) {
            // Update existing student
            await db.students.update(existingStudents[0].id!, student);
          } else {
            // Add new student
            await db.students.add(student);
          }
          studentsImported++;
        } catch (error) {
          console.warn("Error importing student:", row, error);
        }
      }

      // Import marks
      for (const row of marksData) {
        try {
          if (!row.StudentID || !row.Subject || !row.Exam) continue;

          const studentId = parseInt(row.StudentID?.toString());
          const classNum = parseInt(row.Class?.toString());
          const total = parseInt(row.Total?.toString()) || 0;
          const gradePoint = parseFloat(row.GradePoint?.toString()) || 0.0;

          if (isNaN(studentId) || isNaN(classNum)) {
            console.warn("Invalid studentId or class in marks:", row);
            continue;
          }

          const mark: Mark = {
            id: row.ID || undefined,
            studentId,
            subject: row.Subject.toString().trim(),
            exam: row.Exam.toString().trim(),
            class: classNum,
            section: row.Section?.toString().trim() || undefined,
            group: row.Group?.toString().trim() || undefined,
            theory: parseInt(row.Theory?.toString()) || 0,
            mcq: parseInt(row.MCQ?.toString()) || 0,
            practical: parseInt(row.Practical?.toString()) || 0,
            total,
            grade: row.Grade?.toString().trim() || "F",
            gradePoint,
          };

          // Check if mark already exists for same student, subject, and exam
          const existingMarks = await db.marks
            .filter(
              (m) =>
                m.studentId === mark.studentId &&
                m.subject === mark.subject &&
                m.exam === mark.exam,
            )
            .toArray();

          if (existingMarks.length > 0) {
            // Update existing mark
            await db.marks.update(existingMarks[0].id!, mark);
          } else {
            // Add new mark
            await db.marks.add(mark);
          }
          marksImported++;
        } catch (error) {
          console.warn("Error importing mark:", row, error);
        }
      }

      toast.success(
        `Data imported successfully! ${studentsImported} students and ${marksImported} marks processed.`,
      );

      // Reset file input
      event.target.value = "";
    } catch (error) {
      console.error("Error importing data:", error);
      toast.error("Failed to import data");
    }
  };

  return (
    <div className="space-y-4 mobile:space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 mobile:gap-4">
        <div>
          <h1 className="text-lg mobile:text-xl md:text-2xl font-bold">
            📄 Marksheet Generator
          </h1>
          <p className="text-muted-foreground text-xs mobile:text-sm md:text-base">
            Generate individual and section-wise marksheets with PDF export
          </p>
        </div>
        <div className="flex flex-col mobile:flex-row gap-2">
          <Button
            variant="outline"
            onClick={downloadAllData}
            className="w-full mobile:w-auto text-xs mobile:text-sm"
          >
            <Download className="mr-1 mobile:mr-2 h-3 w-3 mobile:h-4 mobile:w-4" />
            <span className="hidden mobile:inline">Download All Data</span>
            <span className="mobile:hidden">Download</span>
          </Button>
          <div className="relative w-full mobile:w-auto">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={uploadAllData}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button
              variant="outline"
              className="w-full mobile:w-auto text-xs mobile:text-sm"
            >
              <Upload className="mr-1 mobile:mr-2 h-3 w-3 mobile:h-4 mobile:w-4" />
              <span className="hidden mobile:inline">Upload All Data</span>
              <span className="mobile:hidden">Upload</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      {!mode && (
        <div className="grid grid-cols-1 mobile:grid-cols-2 lg:grid-cols-3 gap-3 mobile:gap-4 lg:gap-6">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setMode("individual")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Individual Marksheet
              </CardTitle>
              <CardDescription>
                Generate marksheet for a specific student
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setMode("section")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Section-wise Marksheets
              </CardTitle>
              <CardDescription>
                Generate marksheets for all students in a section
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setMode("final")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Final Result
              </CardTitle>
              <CardDescription>
                Generate final marksheet with both half-yearly and yearly marks
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setMode("tabulation")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TableIcon className="h-5 w-5" />
                Tabulation Sheet
              </CardTitle>
              <CardDescription>
                Generate section-wise tabulation sheet in landscape format
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Final Result Marksheets */}
      {mode === "final" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Final Result Generator</CardTitle>
              <CardDescription>
                Generate final marksheet combining half-yearly and yearly
                results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                  >
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

                {parseInt(selectedClass) >= 9 &&
                parseInt(selectedClass) <= 10 ? (
                  <div className="space-y-2">
                    <Label>Group *</Label>
                    <Select
                      value={selectedGroup}
                      onValueChange={setSelectedGroup}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {getGroups(parseInt(selectedClass)).map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Section *</Label>
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

                <div className="space-y-2">
                  <Label>Roll Number (Optional)</Label>
                  <Select value={selectedRoll} onValueChange={setSelectedRoll}>
                    <SelectTrigger>
                      <SelectValue placeholder="All students" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All students</SelectItem>
                      {students.map((student) => (
                        <SelectItem
                          key={student.id}
                          value={student.roll.toString()}
                        >
                          {student.roll} - {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={loadFinalMarksheets}
                  disabled={
                    !selectedClass ||
                    (parseInt(selectedClass) >= 9 &&
                    parseInt(selectedClass) <= 10
                      ? !selectedGroup
                      : !selectedSection) ||
                    loading
                  }
                  className="w-full sm:w-auto"
                >
                  {loading ? "Loading..." : "Generate Final Marksheets"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMode("")}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>

          {finalMarksheets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <span>Final Marksheets Preview</span>
                  <Button
                    onClick={generatePDF}
                    disabled={generating}
                    className="w-full sm:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {generating ? "Generating..." : "Download PDF"}
                  </Button>
                </CardTitle>
                <CardDescription>
                  {finalMarksheets.length} student(s) found with combined
                  results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div ref={marksheetRef}>
                  {finalMarksheets.map((data, index) => (
                    <div key={data.marksheet.student.id}>
                      <div className="individual-marksheet">
                        <FinalMarksheetTemplate
                          marksheet={data.marksheet}
                          halfYearlyMarks={data.halfYearlyMarks}
                          yearlyMarks={data.yearlyMarks}
                        />
                      </div>
                      {index < finalMarksheets.length - 1 && (
                        <div
                          className="page-break"
                          style={{
                            pageBreakAfter: "always",
                            breakAfter: "page",
                            display: "block",
                            height: "0",
                            margin: "0",
                            padding: "0",
                            clear: "both",
                          }}
                        ></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tabulation Sheet */}
      {mode === "tabulation" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tabulation Sheet Generator</CardTitle>
              <CardDescription>
                Generate section/group wise tabulation sheet in landscape format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Exam *</Label>
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
                  <Label>Class *</Label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                  >
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

                {parseInt(selectedClass) >= 9 &&
                parseInt(selectedClass) <= 10 ? (
                  <div className="space-y-2">
                    <Label>Group *</Label>
                    <Select
                      value={selectedGroup}
                      onValueChange={setSelectedGroup}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {getGroups(parseInt(selectedClass)).map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Section *</Label>
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

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={loadTabulationData}
                  disabled={
                    !selectedExam ||
                    !selectedClass ||
                    (parseInt(selectedClass) >= 9 &&
                    parseInt(selectedClass) <= 10
                      ? !selectedGroup
                      : !selectedSection) ||
                    loading
                  }
                  className="w-full sm:w-auto"
                >
                  {loading ? "Loading..." : "Generate Tabulation Sheet"}
                </Button>
                <Button variant="outline" onClick={() => setMode("")} className="w-full sm:w-auto">
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>

          {tabulationData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <span>Tabulation Sheet Preview</span>
                  <Button onClick={generatePDF} disabled={generating} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    {generating ? "Generating..." : "Download PDF"}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Landscape format tabulation sheet for {tabulationData.students.length} students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div ref={marksheetRef}>
                    <TabulationSheet
                      students={tabulationData.students}
                      subjects={tabulationData.subjects}
                      marksMatrix={tabulationData.marksMatrix}
                      totals={tabulationData.totals}
                      grades={tabulationData.grades}
                      positions={tabulationData.positions}
                      selectedExam={selectedExam}
                      selectedClass={selectedClass}
                      selectedSection={selectedSection}
                      selectedGroup={selectedGroup}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Individual Marksheet */}
      {mode === "individual" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Marksheet Generator</CardTitle>
              <CardDescription>
                Select student details to generate marksheet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Exam *</Label>
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
                  <Label>Class *</Label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                  >
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

                {parseInt(selectedClass) >= 9 &&
                parseInt(selectedClass) <= 10 ? (
                  <div className="space-y-2">
                    <Label>Group *</Label>
                    <Select
                      value={selectedGroup}
                      onValueChange={setSelectedGroup}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {getGroups(parseInt(selectedClass)).map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Section *</Label>
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

                <div className="space-y-2">
                  <Label>Roll Number *</Label>
                  <Select value={selectedRoll} onValueChange={setSelectedRoll}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select roll" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem
                          key={student.id}
                          value={student.roll.toString()}
                        >
                          {student.roll} - {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={loadIndividualMarksheet}
                  disabled={
                    !selectedExam ||
                    !selectedClass ||
                    (parseInt(selectedClass) >= 9 &&
                    parseInt(selectedClass) <= 10
                      ? !selectedGroup
                      : !selectedSection) ||
                    !selectedRoll ||
                    loading
                  }
                  className="w-full sm:w-auto"
                >
                  {loading ? "Loading..." : "Generate Marksheet"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMode("")}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>

          {studentMarksheet && (
            <Card className="w-full max-w-[max-content] mx-auto">
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <span>Marksheet Preview</span>
                  <Button
                    onClick={generatePDF}
                    disabled={generating}
                    className="w-full sm:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {generating ? "Generating..." : "Download PDF"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={marksheetRef}>
                  <MarksheetTemplate
                    marksheet={studentMarksheet}
                    selectedExam={selectedExam}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Section-wise Marksheets */}
      {mode === "section" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section-wise Marksheet Generator</CardTitle>
              <CardDescription>
                Generate marksheets for all students in a section
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Exam *</Label>
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
                  <Label>Class *</Label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                  >
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

                {parseInt(selectedClass) >= 9 &&
                parseInt(selectedClass) <= 10 ? (
                  <div className="space-y-2">
                    <Label>Group *</Label>
                    <Select
                      value={selectedGroup}
                      onValueChange={setSelectedGroup}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {getGroups(parseInt(selectedClass)).map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Section *</Label>
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

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={loadSectionMarksheets}
                  disabled={
                    !selectedExam ||
                    !selectedClass ||
                    (parseInt(selectedClass) >= 9 &&
                    parseInt(selectedClass) <= 10
                      ? !selectedGroup
                      : !selectedSection) ||
                    loading
                  }
                  className="w-full sm:w-auto"
                >
                  {loading ? "Loading..." : "Generate Section Marksheets"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMode("")}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>

          {sectionMarksheets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <span>Section Marksheets Preview</span>
                  <Button
                    onClick={generatePDF}
                    disabled={generating}
                    className="w-full sm:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {generating ? "Generating..." : "Download PDF"}
                  </Button>
                </CardTitle>
                <CardDescription>
                  {sectionMarksheets.length} student(s) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div ref={marksheetRef}>
                  {sectionMarksheets.map((marksheet, index) => (
                    <div key={marksheet.student.id}>
                      <div className="individual-marksheet">
                        <MarksheetTemplate
                          marksheet={marksheet}
                          selectedExam={selectedExam}
                        />
                      </div>
                      {index < sectionMarksheets.length - 1 && (
                        <div
                          className="page-break"
                          style={{
                            pageBreakAfter: "always",
                            breakAfter: "page",
                            display: "block",
                            height: "0",
                            margin: "0",
                            padding: "0",
                            clear: "both",
                          }}
                        ></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
