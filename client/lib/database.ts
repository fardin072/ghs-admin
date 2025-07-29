import Dexie, { Table } from "dexie";

export interface Student {
  id?: number;
  name: string;
  roll: number;
  class: number;
  section: string;
  group?: string; // For classes 9-10
}

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

// Helper functions for grading
export const calculateGrade = (
  marks: number,
  totalMarks: number = 100
): { grade: string; gradePoint: number } => {
  // Adjust total marks for specific subjects (already handled in getSubjectMarkingScheme)
  const percentage = (marks / totalMarks) * 100;

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
      "Digital Technology (ICT)",
      "Religion & Moral Education",
      "Health & Physical Ed.",
      "Agriculture",
      "Arts & Culture / Work & Arts",
    ];
  }

  // Classes 9-10 (Group-based subjects)
  if (classNum >= 9 && classNum <= 10) {
    // Common subjects for all groups in classes 9-10
    const commonSubjects = [
      "Bangla 1st Paper",
      "Bangla 2nd Paper",
      "English 1st Paper",
      "English 2nd Paper",
      "Mathematics",
      "Digital Technology (ICT)",
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

export const getGroups = (classNum: number): string[] => {
  if (classNum >= 9 && classNum <= 10) {
    return ["Science", "Business Studies", "Humanities"];
  }
  return [];
};

// Subject name shortening for tabulation display
export const getShortSubjectName = (subject: string): string => {
  const shortNames: { [key: string]: string } = {
    "Bangla 1st Paper": "ban1st",
    "Bangla 2nd Paper": "ban2nd",
    "English 1st Paper": "eng1st",
    "English 2nd Paper": "eng2nd",
    "Mathematics": "math",
    "Science & Technology": "sci&tech",
    "Bangladesh & Global Studies": "bg&gs",
    "Digital Technology (ICT)": "ict",
    "Religion & Moral Education": "religion",
    "Health & Physical Ed.": "hpe",
    "Agriculture": "agri",
    "Arts & Culture / Work & Arts": "arts",
    "Physics": "physics",
    "Chemistry": "chem",
    "Biology": "bio",
    "Bangladesh & Global Science": "bg&sci",
    "Higher Math / Agriculture": "h.math",
    "Higher Math": "h.math",
    "Accounting": "account",
    "Finance": "finance",
    "Business Entrepreneurship": "business",
    "History": "history",
    "Geography": "geo",
    "Civics": "civics",
    "Science": "science"
  };

  return shortNames[subject] || subject.substring(0, 8).toLowerCase();
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
  classNum?: number,
): SubjectMarkingScheme => {
  // Special marking for specific subjects

  // For class 6-8: Bangla 2nd paper and English 2nd paper = 50 marks
  if (classNum && classNum >= 6 && classNum <= 8) {
    if (subject === "Bangla 2nd Paper") {
      return {
        written: 35,
        mcq: 15,
        practical: 0,
        total: 50, // Total is 50 for this subject
      };
    }
    if (subject === "English 2nd Paper") {
      return {
        written: 50,
        mcq: 0,
        practical: 0,
        total: 50, // Total is 50 for this subject
      };
    }
  }

  // ICT for all classes = 50 marks
  if (subject === "Digital Technology (ICT)") {
    return {
      written: 10,
      mcq: 15,
      practical: 25,
      total: 50, // Total is 50 for ICT
    };
  }

  // Other subjects default to 100 marks
  return {
    written: 70,
    mcq: 30,
    practical: 0,
    total: 100,
  };
};

