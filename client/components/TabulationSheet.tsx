import { Student, Mark, getShortSubjectName } from "@/lib/database";

interface TabulationSheetProps {
  students: Student[];
  subjects: string[];
  marksMatrix: { [studentId: number]: { [subject: string]: Mark | null } };
  totals: { [studentId: number]: number };
  positions: { [studentId: number]: number };
  selectedExam: string;
  selectedClass: string;
  selectedSection?: string;
  selectedGroup?: string;
}

// Grade calculation logic for each subject
const calculateGrade = (
  marks: number,
  totalMarks: number = 100,
  subject: string = "",
  classNum: number = 0
): { grade: string; gradePoint: number } => {
  // Adjust total marks to 50 for certain subjects
  if (
    (classNum >= 6 && classNum <= 8 && subject === "Bangla 2nd Paper") ||
    (classNum >= 6 && classNum <= 8 && subject === "English 2nd Paper") ||
    (subject === "Digital Technology (ICT)" || subject === "Arts & Culture / Work & Arts")
  ) {
    totalMarks = 50;
  }

  const percentage = (marks / totalMarks) * 100;

  if (percentage >= 80) return { grade: "A+", gradePoint: 5.0 };
  if (percentage >= 70) return { grade: "A", gradePoint: 4.0 };
  if (percentage >= 60) return { grade: "A-", gradePoint: 3.5 };
  if (percentage >= 50) return { grade: "B", gradePoint: 3.0 };
  if (percentage >= 40) return { grade: "C", gradePoint: 2.0 };
  if (percentage >= 33) return { grade: "D", gradePoint: 1.0 };
  return { grade: "F", gradePoint: 0.0 };
};

// Calculate the overall grade and GPA for a student
const calculateOverallGrade = (
  studentId: number,
  subjects: string[],
  marksMatrix: { [studentId: number]: { [subject: string]: Mark | null } },
  selectedClass: number
): { overallGrade: string, gpa: number } => {
  let totalGradePoints = 0;
  let totalSubjects = 0;
  let hasFailedSubject = false;

  // Loop through each subject for the student
  subjects.forEach((subject) => {
    const mark = marksMatrix[studentId]?.[subject];
    if (mark) {
      // Check if the subject requires 50 total marks, adjust accordingly
      const totalMarks = 
        (selectedClass >= 6 && selectedClass <= 8 && (subject === "Bangla 2nd Paper" || subject === "English 2nd Paper"))
        || subject === "Digital Technology (ICT)"
        || subject === "Arts & Culture / Work & Arts"
        ? 50
        : 100;
      
      const { gradePoint, grade } = calculateGrade(mark.total, totalMarks, subject, selectedClass);
      totalGradePoints += gradePoint;
      totalSubjects += 1;

      // If any subject is failed, mark the student as failed
      if (grade === "F") {
        hasFailedSubject = true;
      }
    }
  });

  // If any subject is failed, the final grade is "F"
  if (hasFailedSubject) {
    return { overallGrade: "F", gpa: 0 };
  }

  // Otherwise, calculate the GPA
  const gpa = totalGradePoints / (totalSubjects * 5); // Max grade per subject is 5.0
  let overallGrade = "F";

  if (gpa >= 4.5) overallGrade = "A+";
  else if (gpa >= 4.0) overallGrade = "A";
  else if (gpa >= 3.5) overallGrade = "A-";
  else if (gpa >= 3.0) overallGrade = "B";
  else if (gpa >= 2.0) overallGrade = "C";
  else if (gpa >= 1.0) overallGrade = "D";

  return { overallGrade, gpa };
};

export function TabulationSheet({
  students,
  subjects,
  marksMatrix,
  totals,
  positions,
  selectedExam,
  selectedClass,
  selectedSection,
  selectedGroup,
}: TabulationSheetProps) {
  const currentYear = new Date().getFullYear();
  const isHighClass = parseInt(selectedClass) >= 9 && parseInt(selectedClass) <= 10;

  // Calculate students per page based on available space
  const studentsPerPage = 13;
  const totalPages = Math.ceil(students.length / studentsPerPage);
  
  // Split students into pages
  const studentPages = [];
  for (let i = 0; i < totalPages; i++) {
    const startIndex = i * studentsPerPage;
    const endIndex = Math.min(startIndex + studentsPerPage, students.length);
    studentPages.push(students.slice(startIndex, endIndex));
  }

  // Calculate the pass rate and failed students dynamically
  const passedStudents = students.filter(student => positions[student.id!] !== "F");
  const failedStudents = students.length - passedStudents.length;
  const passRate = students.length > 0 ? ((passedStudents.length / students.length) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-0">
      {studentPages.map((pageStudents, pageIndex) => (
        <div
          key={pageIndex}
          className="bg-white w-[297mm] h-[210mm] mx-auto p-[10mm] font-serif text-black shadow-lg overflow-hidden tabulation-page"
          style={{
            fontFamily: 'Times, "Times New Roman", serif',
            fontSize: "12px",
            lineHeight: "1.2",
            color: "#000",
            WebkitPrintColorAdjust: "exact",
            colorAdjust: "exact",
            pageBreakAfter: pageIndex < totalPages - 1 ? "always" : "auto",
            breakAfter: pageIndex < totalPages - 1 ? "page" : "auto",
          }}
        >
          {/* Header */}
          <div className="text-center mb-4 border-b-2 border-gray-800 pb-3">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 tracking-wide">
              GUZIA HIGH SCHOOL
            </h1>
            <p className="text-lg text-gray-600 font-medium tracking-wider mb-2">
              Guzia, Shibganj, Bogura
            </p>
            <div className="inline-block border-2 border-gray-300 py-2 px-4">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedExam} EXAMINATION - {currentYear}
              </h2>
              <p className="text-base font-medium text-gray-600 uppercase tracking-wide">
                TABULATION SHEET - CLASS {selectedClass}
                {isHighClass ? ` (GROUP: ${selectedGroup})` : ` (SECTION: ${selectedSection})`}
                {totalPages > 1 && ` - PAGE ${pageIndex + 1} OF ${totalPages}`}
              </p>
            </div>
          </div>

          {/* Marks Table */}
          <div className="mb-4">
            <table className="w-full border-collapse text-sm" style={{ fontSize: "11px" }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-center font-bold text-gray-800 w-10">
                    #
                  </th>
                  <th className="border border-gray-400 p-2 text-center font-bold text-gray-800 w-14">
                    Roll
                  </th>
                  <th className="border border-gray-400 p-2 text-left font-bold text-gray-800 min-w-[100px]">
                    Student Name
                  </th>
                  {subjects.map((subject) => (
                    <th
                      key={subject}
                      className="border border-gray-400 p-2 text-center font-bold text-gray-800 min-w-[40px]"
                      style={{
                        maxWidth: '45px',
                        fontSize: '10px'
                      }}
                    >
                      <div style={{
                        writingMode: 'vertical-lr',
                        textOrientation: 'mixed',
                        height: '65px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap'
                      }}>
                        {getShortSubjectName(subject)}
                      </div>
                    </th>
                  ))}
                  <th className="border border-gray-400 p-2 text-center font-bold text-gray-800 w-14">
                    Total
                  </th>
                  <th className="border border-gray-400 p-2 text-center font-bold text-gray-800 w-12">
                    Position
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageStudents.map((student, index) => {
                  const globalIndex = pageIndex * studentsPerPage + index;
                  const { overallGrade } = calculateOverallGrade(student.id!, subjects, marksMatrix, parseInt(selectedClass));
                  return (
                    <tr key={student.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="border border-gray-400 p-2 text-center text-sm">
                        {globalIndex + 1}
                      </td>
                      <td className="border border-gray-400 p-2 text-center font-medium text-sm">
                        {student.roll}
                      </td>
                      <td className="border border-gray-400 p-2 text-left font-medium text-sm">
                        {student.name}
                      </td>
                      {subjects.map((subject) => {
                        const mark = marksMatrix[student.id!]?.[subject];
                        const { grade } = calculateGrade(mark?.total || 0, 100, subject, parseInt(selectedClass));
                        return (
                          <td
                            key={subject}
                            className={`border border-gray-400 p-2 text-center text-sm ${
                              grade === "F" ? "bg-red-200" : ""
                            }`}
                          >
                            {mark ? mark.total : 0}
                          </td>
                        );
                      })}
                      <td className="border border-gray-400 p-2 text-center font-bold bg-blue-50 text-sm">
                        {totals[student.id!] || 0}
                      </td>
                      <td className="border border-gray-400 p-2 text-center font-bold bg-green-50 text-sm">
                        {positions[student.id!] || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-2 border-t border-gray-300 text-center">
            <p className="text-sm text-gray-500">
              This tabulation sheet is computer generated and shows all students' performance in {selectedExam} examination.
            </p>
            <p className="text-sm text-gray-500">
              Generated on: {new Date().toLocaleDateString("en-GB")} | GUZIA HIGH SCHOOL Management System
              {totalPages > 1 && ` | Page ${pageIndex + 1} of ${totalPages}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
