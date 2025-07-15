import { StudentMarksheet } from "@/pages/Marksheet";
import { getSubjectMarkingScheme } from "@/lib/database";

interface MarksheetTemplateProps {
  marksheet: StudentMarksheet;
  selectedExam: string;
}

export function MarksheetTemplate({
  marksheet,
  selectedExam,
}: MarksheetTemplateProps) {
  const currentYear = new Date().getFullYear();

  // Calculate total marks obtained and total possible marks
  const totalObtained = marksheet.marks.reduce(
    (sum, mark) => sum + mark.total,
    0,
  );
  const totalPossible = marksheet.marks.reduce((sum, mark) => {
    const scheme = getSubjectMarkingScheme(mark.subject);
    return sum + scheme.total;
  }, 0);

  // Check if any subject is failed
  const hasFailedSubject = marksheet.marks.some((mark) => mark.grade === "F");

  return (
    <div
      className="bg-white w-[210mm] h-[297mm] mx-auto p-[12mm] font-serif text-black shadow-lg overflow-hidden"
      style={{
        fontFamily: 'Times, "Times New Roman", serif',
        fontSize: "11px",
        lineHeight: "1.3",
        color: "#000",
        WebkitPrintColorAdjust: "exact",
        colorAdjust: "exact",
      }}
    >
      {/* Header */}
      <div className="text-center mb-4 border-b-2 border-gray-800 pb-3">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800 mb-1 tracking-wide">
            GUZIA HIGH SCHOOL
          </h1>
          <p className="text-base text-gray-600 font-medium tracking-wider">
            Guzia, Shibganj, Bogura
          </p>
        </div>

        <div
          className="py-2 px-4 inline-block border-2 border-gray-300"
          style={{
            border: "2px solid #d1d5db",
            WebkitPrintColorAdjust: "exact",
            colorAdjust: "exact",
          }}
        >
          <h2
            className="text-lg font-bold text-gray-800 mb-0"
            style={{
              color: "#1f2937",
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "2px",
              WebkitPrintColorAdjust: "exact",
              colorAdjust: "exact",
            }}
          >
            {selectedExam} EXAMINATION - {currentYear}
          </h2>
          <p
            className="text-xs font-medium text-gray-600 uppercase tracking-widest"
            style={{
              color: "#4b5563",
              fontSize: "10px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              WebkitPrintColorAdjust: "exact",
              colorAdjust: "exact",
            }}
          >
            ACADEMIC TRANSCRIPT
          </p>
        </div>
      </div>

      {/* Student Information */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="border border-gray-300 p-2 rounded">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Student Name
          </div>
          <div className="text-sm font-bold text-gray-800 border-b border-dotted border-gray-400 pb-1">
            {marksheet.student.name}
          </div>
        </div>

        <div className="border border-gray-300 p-2 rounded">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Class
          </div>
          <div className="text-sm font-bold text-gray-800 border-b border-dotted border-gray-400 pb-1">
            Class {marksheet.student.class}
          </div>
        </div>

        <div className="border border-gray-300 p-2 rounded">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Roll Number
          </div>
          <div className="text-sm font-bold text-gray-800 border-b border-dotted border-gray-400 pb-1">
            {marksheet.student.roll}
          </div>
        </div>

        <div className="border border-gray-300 p-2 rounded">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Section
          </div>
          <div className="text-sm font-bold text-gray-800 border-b border-dotted border-gray-400 pb-1">
            {marksheet.student.section}
          </div>
        </div>
      </div>

      {/* Marks Table */}
      <div className="mb-4">
        <div className="bg-gray-800 text-white p-2 rounded-t-lg">
          <h3 className="text-sm font-bold text-center uppercase tracking-wider">
            SUBJECT WISE MARKS & GRADES
          </h3>
        </div>

        <table className="w-full border-collapse bg-white rounded-b-lg overflow-hidden shadow-sm text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-1 text-left font-bold text-gray-800">
                Subject Name
              </th>
              <th className="border border-gray-300 p-1 text-center font-bold text-gray-800 w-12">
                Written
              </th>
              <th className="border border-gray-300 p-1 text-center font-bold text-gray-800 w-12">
                MCQ
              </th>
              <th className="border border-gray-300 p-1 text-center font-bold text-gray-800 w-12">
                Practical
              </th>
              <th className="border border-gray-300 p-1 text-center font-bold text-gray-800 w-12">
                Total
              </th>
              <th className="border border-gray-300 p-1 text-center font-bold text-gray-800 w-12">
                Grade
              </th>
              <th className="border border-gray-300 p-1 text-center font-bold text-gray-800 w-12">
                GPA
              </th>
            </tr>
          </thead>
          <tbody>
            {marksheet.marks.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="border border-gray-300 p-4 text-center text-gray-500"
                >
                  No marks entered yet
                </td>
              </tr>
            ) : (
              marksheet.marks.map((mark, index) => {
                const scheme = getSubjectMarkingScheme(mark.subject);
                return (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="border border-gray-300 p-1 font-medium align-middle">
                      {mark.subject}
                    </td>
                    <td className="border border-gray-300 p-1 text-center align-middle">
                      {scheme.written > 0 ? mark.theory || "0" : "-"}
                    </td>
                    <td className="border border-gray-300 p-1 text-center align-middle">
                      {scheme.mcq > 0 ? mark.mcq || "0" : "-"}
                    </td>
                    <td className="border border-gray-300 p-1 text-center align-middle">
                      {scheme.practical > 0 ? mark.practical || "0" : "-"}
                    </td>
                    <td className="border border-gray-300 p-1 text-center align-middle font-bold bg-blue-50">
                      {mark.total}
                    </td>
                    <td className="border border-gray-300 p-1 text-center align-middle font-bold">
                      {mark.grade}
                    </td>
                    <td className="border border-gray-300 p-1 text-center align-middle font-bold">
                      {mark.gradePoint.toFixed(1)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
          <h4 className="text-sm font-bold text-blue-800 mb-2 text-center">
            ACADEMIC SUMMARY
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-700">Total Subjects:</span>
              <span className="font-bold text-blue-900">
                {marksheet.subjects}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-700">
                Total Grade Points:
              </span>
              <span className="font-bold text-blue-900">
                {marksheet.totalGradePoints.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-700">Total Marks:</span>
              <span className="font-bold text-blue-900">
                {totalObtained} / {totalPossible}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-700">Overall GPA:</span>
              <span className="font-bold text-blue-900 text-sm">
                {hasFailedSubject ? "0.00" : marksheet.gpa.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
          <h4 className="text-sm font-bold text-green-800 mb-2 text-center">
            FINAL RESULT
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-700">Letter Grade:</span>
              <span className="font-bold text-green-900 text-lg">
                {hasFailedSubject
                  ? "F"
                  : marksheet.gpa >= 5.0
                    ? "A+"
                    : marksheet.gpa >= 4.0
                      ? "A"
                      : marksheet.gpa >= 3.5
                        ? "A-"
                        : marksheet.gpa >= 3.0
                          ? "B"
                          : marksheet.gpa >= 2.0
                            ? "C"
                            : marksheet.gpa >= 1.0
                              ? "D"
                              : "F"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-700">Status:</span>
              <span
                className={`font-bold text-sm ${!hasFailedSubject && marksheet.gpa >= 1.0 ? "text-green-900" : "text-red-900"}`}
              >
                {!hasFailedSubject && marksheet.gpa >= 1.0 ? "PASS" : "FAIL"}
              </span>
            </div>
            {marksheet.sectionRank && marksheet.totalStudentsInSection && (
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-700">
                  Section Rank:
                </span>
                <span className="font-bold text-green-900 text-sm">
                  {marksheet.sectionRank} of {marksheet.totalStudentsInSection}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grading Scale */}
      <div className="mb-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
        <h4 className="text-center font-bold text-gray-800 mb-2 text-xs">
          GRADING SCALE
        </h4>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          <div className="bg-green-100 p-1 rounded border border-green-300">
            <div className="font-bold text-green-800">A+</div>
            <div className="text-green-600 text-xs">80-100</div>
            <div className="text-green-600 text-xs">5.00</div>
          </div>
          <div className="bg-blue-100 p-1 rounded border border-blue-300">
            <div className="font-bold text-blue-800">A</div>
            <div className="text-blue-600 text-xs">70-79</div>
            <div className="text-blue-600 text-xs">4.00</div>
          </div>
          <div className="bg-indigo-100 p-1 rounded border border-indigo-300">
            <div className="font-bold text-indigo-800">A-</div>
            <div className="text-indigo-600 text-xs">60-69</div>
            <div className="text-indigo-600 text-xs">3.50</div>
          </div>
          <div className="bg-purple-100 p-1 rounded border border-purple-300">
            <div className="font-bold text-purple-800">B</div>
            <div className="text-purple-600 text-xs">50-59</div>
            <div className="text-purple-600 text-xs">3.00</div>
          </div>
          <div className="bg-yellow-100 p-1 rounded border border-yellow-300">
            <div className="font-bold text-yellow-800">C</div>
            <div className="text-yellow-600 text-xs">40-49</div>
            <div className="text-yellow-600 text-xs">2.00</div>
          </div>
          <div className="bg-orange-100 p-1 rounded border border-orange-300">
            <div className="font-bold text-orange-800">D</div>
            <div className="text-orange-600 text-xs">33-39</div>
            <div className="text-orange-600 text-xs">1.00</div>
          </div>
          <div className="bg-red-100 p-1 rounded border border-red-300">
            <div className="font-bold text-red-800">F</div>
            <div className="text-red-600 text-xs">0-32</div>
            <div className="text-red-600 text-xs">0.00</div>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="mt-4 pt-3 border-t-2 border-gray-300">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="h-8 border-b border-gray-400"></div>
            <div>
              <p className="font-bold text-gray-800 text-xs">Class Teacher</p>
              <p className="text-xs text-gray-600">Signature & Date</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-8 border-b border-gray-400"></div>
            <div>
              <p className="font-bold text-gray-800 text-xs">Headmaster</p>
              <p className="text-xs text-gray-600">Signature & Date</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-8 border-b border-gray-400"></div>
            <div>
              <p className="font-bold text-gray-800 text-xs">Guardian</p>
              <p className="text-xs text-gray-600">Signature & Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-gray-300 text-center">
        <p className="text-xs text-gray-500">
          This marksheet is computer generated and does not require any seal or
          signature to be valid.
        </p>
        <p className="text-xs text-gray-500">
          Generated on: {new Date().toLocaleDateString("en-GB")} | GUZIA HIGH
          SCHOOL Management System
        </p>
      </div>
    </div>
  );
}
