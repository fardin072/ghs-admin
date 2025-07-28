import { StudentMarksheet } from "@/pages/Marksheet";
import { getSubjectMarkingScheme, Mark, getSubjectsByClassAndGroup } from "@/lib/database";

interface FinalMarksheetTemplateProps {
  marksheet: StudentMarksheet;
  halfYearlyMarks: Mark[];
  yearlyMarks: Mark[];
}

export function FinalMarksheetTemplate({
  marksheet,
  halfYearlyMarks,
  yearlyMarks,
}: FinalMarksheetTemplateProps) {
  const currentYear = new Date().getFullYear();

  // Calculate totals for both exams
  const halfYearlyTotal = halfYearlyMarks.reduce(
    (sum, mark) => sum + mark.total,
    0,
  );
  const yearlyTotal = yearlyMarks.reduce((sum, mark) => sum + mark.total, 0);
  const grandTotal = halfYearlyTotal + yearlyTotal;

  // Calculate GPA for both exams
  const halfYearlyGPA =
    halfYearlyMarks.length > 0
      ? halfYearlyMarks.reduce((sum, mark) => sum + mark.gradePoint, 0) /
        halfYearlyMarks.length
      : 0;
  const yearlyGPA =
    yearlyMarks.length > 0
      ? yearlyMarks.reduce((sum, mark) => sum + mark.gradePoint, 0) /
        yearlyMarks.length
      : 0;
  const finalGPA = (halfYearlyGPA + yearlyGPA) / 2;

  // Check if any subject failed in either exam
  const hasFailedSubject =
    halfYearlyMarks.some((mark) => mark.grade === "F") ||
    yearlyMarks.some((mark) => mark.grade === "F");

  // Get all subjects dynamically based on student class and group (for 9-10)
  const allSubjects = getSubjectsByClassAndGroup(marksheet.student.class, marksheet.student.group);

  const totalPossible = allSubjects.reduce((sum, subject) => {
    const scheme = getSubjectMarkingScheme(subject);
    return sum + scheme.total * 2; // Both half-yearly and yearly
  }, 0);

  return (
    <div
      className="bg-white w-[210mm] h-[297mm] mx-auto p-[10mm] font-serif text-black shadow-lg overflow-hidden"
      style={{
        fontFamily: 'Times, "Times New Roman", serif',
        fontSize: "10px",
        lineHeight: "1.2",
        color: "#000",
        WebkitPrintColorAdjust: "exact",
        colorAdjust: "exact",
      }}
    >
      {/* Header */}
      <div className="text-center mb-3 border-b-2 border-gray-800 pb-2">
        <div className="mb-2">
          <h1 className="text-xl font-bold text-gray-800 mb-1 tracking-wide">
            GUZIA HIGH SCHOOL
          </h1>
          <p className="text-sm text-gray-600 font-medium tracking-wider">
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
            className="text-base font-bold text-gray-800 mb-0"
            style={{
              color: "#1f2937",
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "2px",
              WebkitPrintColorAdjust: "exact",
              colorAdjust: "exact",
            }}
          >
            FINAL RESULT - {currentYear}
          </h2>
          <p
            className="text-xs font-medium text-gray-600 uppercase tracking-widest"
            style={{
              color: "#4b5563",
              fontSize: "9px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              WebkitPrintColorAdjust: "exact",
              colorAdjust: "exact",
            }}
          >
            COMBINED ACADEMIC TRANSCRIPT
          </p>
        </div>
      </div>

      {/* Student Information */}
      <div className="grid grid-cols-4 gap-2 mb-3">
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
            {marksheet.student.group ? "Group" : "Section"}
          </div>
          <div className="text-sm font-bold text-gray-800 border-b border-dotted border-gray-400 pb-1">
            {marksheet.student.group || marksheet.student.section}
          </div>
        </div>
      </div>

      {/* Combined Marks Table */}
      <div className="mb-3">
        <div className="bg-gray-800 text-white p-2 rounded-t-lg">
          <h3 className="text-sm font-bold text-center uppercase tracking-wider">
            FINAL RESULT - COMBINED MARKS & GRADES
          </h3>
        </div>

        <table className="w-full border-collapse bg-white rounded-b-lg overflow-hidden shadow-sm text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th
                className="border border-gray-300 p-1 text-left font-bold text-gray-800"
                rowSpan={2}
              >
                Subject Name
              </th>
              <th
                className="border border-gray-300 p-1 text-center font-bold text-gray-800"
                colSpan={3}
              >
                Half-Yearly
              </th>
              <th
                className="border border-gray-300 p-1 text-center font-bold text-gray-800"
                colSpan={3}
              >
                Yearly
              </th>
              <th
                className="border border-gray-300 p-1 text-center font-bold text-gray-800"
                rowSpan={2}
              >
                Total
                <br />
                (Combined)
              </th>
              <th
                className="border border-gray-300 p-1 text-center font-bold text-gray-800"
                rowSpan={2}
              >
                Final
                <br />
                Grade
              </th>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-1 text-center font-bold text-gray-800 w-10">
                Total
              </th>
              <th className="border border-gray-300 p-1 text-center font-bold text-gray-800 w-8">
                Grade
              </th>
              <th className="border border-gray-300 p-1 text-center font-bold text-gray-800 w-8">
                GP
              </th>
              <th className="border border-gray-300 p-1 text-center font-bold text-gray-800 w-10">
                Total
              </th>
              <th className="border border-gray-300 p-1 text-center font-bold text-gray-800 w-8">
                Grade
              </th>
              <th className="border border-gray-300 p-1 text-center font-bold text-gray-800 w-8">
                GP
              </th>
            </tr>
          </thead>
          <tbody>
            {allSubjects.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="border border-gray-300 p-4 text-center text-gray-500"
                >
                  No marks entered yet
                </td>
              </tr>
            ) : (
              allSubjects.map((subject, index) => {
                const halfYearlyMark = halfYearlyMarks.find(
                  (m) => m.subject === subject,
                );
                const yearlyMark = yearlyMarks.find(
                  (m) => m.subject === subject,
                );
                const combinedTotal =
                  (halfYearlyMark?.total || 0) + (yearlyMark?.total || 0);
                const combinedGP =
                  ((halfYearlyMark?.gradePoint || 0) +
                    (yearlyMark?.gradePoint || 0)) /
                  2;

                // Determine final grade based on combined GPA
                const finalGrade =
                  combinedGP >= 5.0
                    ? "A+"
                    : combinedGP >= 4.0
                      ? "A"
                      : combinedGP >= 3.5
                        ? "A-"
                        : combinedGP >= 3.0
                          ? "B"
                          : combinedGP >= 2.0
                            ? "C"
                            : combinedGP >= 1.0
                              ? "D"
                              : "F";

                return (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="border border-gray-300 p-1 font-medium align-middle">
                      {subject}
                    </td>

                    {/* Half-Yearly */}
                    <td className="border border-gray-300 p-1 text-center align-middle">
                      {halfYearlyMark?.total || "0"}
                    </td>
                    <td className="border border-gray-300 p-1 text-center align-middle font-bold">
                      {halfYearlyMark?.grade || "F"}
                    </td>
                    <td className="border border-gray-300 p-1 text-center align-middle">
                      {halfYearlyMark?.gradePoint.toFixed(1) || "0.0"}
                    </td>

                    {/* Yearly */}
                    <td className="border border-gray-300 p-1 text-center align-middle">
                      {yearlyMark?.total || "0"}
                    </td>
                    <td className="border border-gray-300 p-1 text-center align-middle font-bold">
                      {yearlyMark?.grade || "F"}
                    </td>
                    <td className="border border-gray-300 p-1 text-center align-middle">
                      {yearlyMark?.gradePoint.toFixed(1) || "0.0"}
                    </td>

                    {/* Combined */}
                    <td className="border border-gray-300 p-1 text-center align-middle font-bold bg-blue-50">
                      {combinedTotal}
                    </td>
                    <td className="border border-gray-300 p-1 text-center align-middle font-bold bg-green-50">
                      {finalGrade}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-2 rounded-lg border border-blue-200">
          <h4 className="text-xs font-bold text-blue-800 mb-1 text-center">
            HALF-YEARLY SUMMARY
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-700">Total Marks:</span>
              <span className="font-bold text-blue-900">{halfYearlyTotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-700">GPA:</span>
              <span className="font-bold text-blue-900">
                {halfYearlyGPA.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-2 rounded-lg border border-purple-200">
          <h4 className="text-xs font-bold text-purple-800 mb-1 text-center">
            YEARLY SUMMARY
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-medium text-purple-700">Total Marks:</span>
              <span className="font-bold text-purple-900">{yearlyTotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-purple-700">GPA:</span>
              <span className="font-bold text-purple-900">
                {yearlyGPA.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-2 rounded-lg border border-green-200">
          <h4 className="text-xs font-bold text-green-800 mb-1 text-center">
            FINAL RESULT
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-700">Grand Total:</span>
              <span className="font-bold text-green-900">
                {grandTotal} / {totalPossible}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-700">Final GPA:</span>
              <span className="font-bold text-green-900">
                {hasFailedSubject ? "0.00" : finalGPA.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-700">Final Grade:</span>
              <span className="font-bold text-green-900 text-sm">
                {hasFailedSubject
                  ? "F"
                  : finalGPA >= 5.0
                  ? "A+"
                  : finalGPA >= 4.0
                  ? "A"
                  : finalGPA >= 3.5
                  ? "A-"
                  : finalGPA >= 3.0
                  ? "B"
                  : finalGPA >= 2.0
                  ? "C"
                  : finalGPA >= 1.0
                  ? "D"
                  : "F"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-700">Status:</span>
              <span
                className={`font-bold text-xs ${!hasFailedSubject && finalGPA >= 1.0 ? "text-green-900" : "text-red-900"}`}
              >
                {!hasFailedSubject && finalGPA >= 1.0 ? "PASS" : "FAIL"}
              </span>
            </div>
            {marksheet.sectionRank && marksheet.totalStudentsInSection && (
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-700">
                  Merit Position:
                </span>
                <span className="font-bold text-green-900 text-xs">
                  {marksheet.sectionRank} of {marksheet.totalStudentsInSection}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grading Scale */}
      <div className="mb-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
        <h4 className="text-center font-bold text-gray-800 mb-1 text-xs">
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
      <div className="mt-3 pt-2 border-t-2 border-gray-300">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="h-6 border-b border-gray-400"></div>
            <div>
              <p className="font-bold text-gray-800 text-xs">Class Teacher</p>
              <p className="text-xs text-gray-600">Signature & Date</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-6 border-b border-gray-400"></div>
            <div>
              <p className="font-bold text-gray-800 text-xs">Headmaster</p>
              <p className="text-xs text-gray-600">Signature & Date</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-6 border-b border-gray-400"></div>
            <div>
              <p className="font-bold text-gray-800 text-xs">Guardian</p>
              <p className="text-xs text-gray-600">Signature & Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-1 border-t border-gray-300 text-center">
        <p className="text-xs text-gray-500">
          This final marksheet combines both Half-Yearly and Yearly examination
          results.
        </p>
        <p className="text-xs text-gray-500">
          Generated on: {new Date().toLocaleDateString("en-GB")} | GUZIA HIGH
          SCHOOL Management System
        </p>
      </div>
    </div>
  );
}
