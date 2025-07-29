import { Student, Mark, getShortSubjectName } from "@/lib/database";

interface TabulationSheetProps {
  students: Student[];
  subjects: string[];
  marksMatrix: { [studentId: number]: { [subject: string]: Mark | null } };
  totals: { [studentId: number]: number };
  grades: { [studentId: number]: string };
  positions: { [studentId: number]: number };
  selectedExam: string;
  selectedClass: string;
  selectedSection?: string;
  selectedGroup?: string;
}

export function TabulationSheet({
  students,
  subjects,
  marksMatrix,
  totals,
  grades,
  positions,
  selectedExam,
  selectedClass,
  selectedSection,
  selectedGroup,
}: TabulationSheetProps) {
  const currentYear = new Date().getFullYear();
  const isHighClass = parseInt(selectedClass) >= 9 && parseInt(selectedClass) <= 10;
  
  // Calculate students per page based on available space
  // A4 landscape: 210mm height - header (~70mm) - footer (~50mm) - margins (~20mm) = ~70mm
  // Each row is approximately 6mm with increased fonts, so we can fit about 13 students per page
  const studentsPerPage = 13;
  const totalPages = Math.ceil(students.length / studentsPerPage);
  
  // Split students into pages
  const studentPages = [];
  for (let i = 0; i < totalPages; i++) {
    const startIndex = i * studentsPerPage;
    const endIndex = Math.min(startIndex + studentsPerPage, students.length);
    studentPages.push(students.slice(startIndex, endIndex));
  }

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
                    Grade
                  </th>
                  <th className="border border-gray-400 p-2 text-center font-bold text-gray-800 w-12">
                    Position
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageStudents.map((student, index) => {
                  const globalIndex = pageIndex * studentsPerPage + index;
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
                        return (
                          <td
                            key={subject}
                            className="border border-gray-400 p-2 text-center text-sm"
                          >
                            {mark ? mark.total : 0}
                          </td>
                        );
                      })}
                      <td className="border border-gray-400 p-2 text-center font-bold bg-blue-50 text-sm">
                        {totals[student.id!] || 0}
                      </td>
                      <td className="border border-gray-400 p-2 text-center font-bold text-sm">
                        {grades[student.id!] || "F"}
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

          {/* Summary Section - only show on last page */}
          {pageIndex === totalPages - 1 && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <h4 className="text-base font-bold text-blue-800 mb-2">STATISTICS</h4>
                <div className="text-sm space-y-1">
                  <div>Total Students: <span className="font-bold">{students.length}</span></div>
                  <div>Total Subjects: <span className="font-bold">{subjects.length}</span></div>
                  <div>Examination: <span className="font-bold">{selectedExam}</span></div>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded border border-green-200">
                <h4 className="text-base font-bold text-green-800 mb-2">GRADING SCALE</h4>
                <div className="text-sm space-y-1">
                  <div>A+ (80-100%) - 5.00 | A (70-79%) - 4.00</div>
                  <div>A- (60-69%) - 3.50 | B (50-59%) - 3.00</div>
                  <div>C (40-49%) - 2.00 | D (33-39%) - 1.00</div>
                  <div>F (0-32%) - 0.00</div>
                  <div className="mt-2 text-gray-600 italic text-xs">*Any subject fail = Final grade F</div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <h4 className="text-base font-bold text-gray-800 mb-2">PERFORMANCE</h4>
                <div className="text-sm space-y-1">
                  {(() => {
                    const passed = students.filter(s => grades[s.id!] !== "F").length;
                    const failed = students.length - passed;
                    const passRate = students.length > 0 ? (passed / students.length * 100).toFixed(1) : "0";
                    return (
                      <>
                        <div>Passed: <span className="font-bold text-green-600">{passed}</span></div>
                        <div>Failed: <span className="font-bold text-red-600">{failed}</span></div>
                        <div>Pass Rate: <span className="font-bold">{passRate}%</span></div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Signature Section - only show on last page */}
          {pageIndex === totalPages - 1 && (
            <div className="mt-6 pt-4 border-t-2 border-gray-300">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div className="space-y-3">
                  <div className="h-10 border-b border-gray-400"></div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Class Teacher</p>
                    <p className="text-sm text-gray-600">Signature & Date</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-10 border-b border-gray-400"></div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Headmaster</p>
                    <p className="text-sm text-gray-600">Signature & Date</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-10 border-b border-gray-400"></div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Examination Controller</p>
                    <p className="text-sm text-gray-600">Signature & Date</p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
