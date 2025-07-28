import Dexie, { Table } from "dexie";

// Student Interface
export interface Student {
  id?: number;
  name: string;
  roll: number;
  class: number;
  section: string;
  group?: string; // For classes 9-10
}

// Mark Interface
export interface Mark {
  id?: number;
  studentId: number;
  subject: string;
  exam: string;
  class: number;
  section: string;
  group?: string;
  theory?: number;
  mcq?: number;
  practical?: number;
  total: number;
  grade: string;
  gradePoint: number;
}

// Database class extends Dexie
export class SchoolDatabase extends Dexie {
  students!: Table<Student>;
  marks!: Table<Mark>;

  constructor() {
    super("SchoolDatabase");
    this.version(1).stores({
      students: "++id, name, roll, class, section, group",
      marks:
        "++id, studentId, subject, exam, class, section, group, theory, mcq, practical, total, grade, gradePoint",
    });
  }
}

export const db = new SchoolDatabase();

// Helper function for grading
export const calculateGrade = (
  percentage: number,
): { grade: string; gradePoint: number } => {
  if (percentage >= 80) return { grade: "A+", gradePoint: 5.0 };
  if (percentage >= 70) return { grade: "A", gradePoint: 4.0 };
  if (percentage >= 60) return { grade: "A-", gradePoint: 3.5 };
  if (percentage >= 50) return { grade: "B", gradePoint: 3.0 };
  if (percentage >= 40) return { grade: "C", gradePoint: 2.0 };
  if (percentage >= 33) return { grade: "D", gradePoint: 1.0 };
  return { grade: "F", gradePoint: 0.0 };
};

// Subject definitions by class and group
export const getSubjectsByClassAndGroup = (
  classNum: number,
  group?: string,
): string[] => {
  // Classes 6-8 (All Common Subjects)
  if (classNum >= 6 && classNum <= 8) {
    return [
      "Bangla 1st Paper",
      "Bangla 2nd Paper",
      "English 1st Paper",
      "English 2nd Paper",
      "Mathematics",
      "Science & Technology",
      "Bangladesh & Global Studies",
      "Digital Technology (ICT)",  // Include ICT for all classes 6-8
      "Religion & Moral Education",
      "Health & Physical Ed.",
      "Agriculture",
      "Arts & Culture / Work & Arts",
    ];
  }

  // Classes 9-10 (Group-based subjects)
  if (classNum >= 9 && classNum <= 10) {
    const commonSubjects = [
      "Bangla 1st Paper",
      "Bangla 2nd Paper",
      "English 1st Paper",
      "English 2nd Paper",
      "Mathematics",
      "Digital Technology (ICT)",  // Include ICT for classes 9-10
      "Religion & Moral Education",
    ];

    switch (group) {
      case "Science":
        return [
          ...commonSubjects,
          "Physics",
          "Chemistry",
          "Biology",
          "Bangladesh & Global Science",
          "Higher Math / Agriculture",
        ];
      case "Business Studies":
        return [
          ...commonSubjects,
          "Accounting",
          "Finance",
          "Business Entrepreneurship",
        ];
      case "Humanities":
        return [...commonSubjects, "History", "Geography", "Civics", "Science"];
      default:
        return commonSubjects;
    }
  }

  return [];
};

// Get groups for classes 9-10
export const getGroups = (classNum: number): string[] => {
  if (classNum >= 9 && classNum <= 10) {
    return ["Science", "Business Studies", "Humanities"];
  }
  return [];
};

// Subject marking schemes
export interface SubjectMarkingScheme {
  written: number;
  mcq: number;
  practical: number;
  total: number;
}

export const getSubjectMarkingScheme = (
  subject: string,
  classNum: number
): SubjectMarkingScheme => {
  // Only for Classes 6-8, Bangla 2nd and English 2nd paper have specific marking schemes
  if (classNum >= 6 && classNum <= 8) {
    // ICT subject: Written (10) + MCQ (15) + Practical (25) = 50
    if (subject === "Digital Technology (ICT)") {
      return {
        written: 10,
        mcq: 15,
        practical: 25,
        total: 50,
      };
    }

    // English 2nd Paper: Written (35) + MCQ (15) = 50
    if (subject === "English 2nd Paper") {
      return {
        written: 50,
        mcq: 0,
        practical: 0,
        total: 50,
      };
    }

    // Bangla 2nd Paper: Written (35) + MCQ (15) = 50
    if (subject === "Bangla 2nd Paper") {
      return {
        written: 35,
        mcq: 15,
        practical: 0,
        total: 50,
      };
    }
  }

  // For Classes 9-10, all subjects remain the same (max 100)
  if (classNum >= 9 && classNum <= 10) {
    // English 1st Paper and Bangla 1st Paper remain max 100
    if (subject === "English 1st Paper") {
      return {
        written: 100,
        mcq: 0,
        practical: 0,
        total: 100,
      };
    }
    if (subject === "Bangla 1st Paper") {
      return {
        written: 70,
        mcq: 30,
        practical: 0,
        total: 100,
      };
    }

    // English 2nd Paper and Bangla 2nd Paper remain max 100
    if (subject === "English 2nd Paper") {
      return {
        written: 100,
        mcq: 0,
        practical: 0,
        total: 100,
      };
    }
    if (subject === "Bangla 2nd Paper") {
      return {
        written: 70,
        mcq: 30,
        practical: 0,
        total: 100,
      };
    }

    // ICT subject for Classes 9-10 remains max 50
    if (subject === "Digital Technology (ICT)") {
      return {
        written: 10,
        mcq: 15,
        practical: 25,
        total: 50,
      };
    }

    // Science subjects: Written (50) + MCQ (25) + Practical (25) = 100
    const scienceSubjects = [
      "Higher Math / Agriculture",
      "Higher Math",
      "Physics",
      "Chemistry",
      "Biology",
    ];

    if (scienceSubjects.includes(subject)) {
      return {
        written: 50,
        mcq: 25,
        practical: 25,
        total: 100,
      };
    }

    // All other subjects: Written (70) + MCQ (30) = 100
    return {
      written: 70,
      mcq: 30,
      practical: 0,
      total: 100,
    };
  }

  // Default case for any other scenarios
  return {
    written: 70,
    mcq: 30,
    practical: 0,
    total: 100,
  };
};
