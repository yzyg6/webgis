// ucas_earth/src/types/courses.ts
export interface Course {
  id: number;
  name: string;
  classroom: string;
  buildingName: string;
  weekday: number;  // 1-7, 1=周一, 7=周日
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  weekRange: string;  // "1-16" 或 "1,3,5,7"
  teacher?: string;
  courseType: 'required' | 'elective';
  credits: number;
  homeworkDue?: string;
  examTime?: string;
  evaluation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseCreateInput {
  name: string;
  classroom: string;
  buildingName: string;
  weekday: number;
  startTime: string;
  endTime: string;
  weekRange: string;
  teacher?: string;
  courseType?: 'required' | 'elective';
  credits?: number;
  homeworkDue?: string;
  examTime?: string;
}

export interface CourseUpdateInput extends Partial<CourseCreateInput> {
  id: number;
}

export interface CourseImportRow {
  name: string;
  classroom: string;
  buildingName: string;
  weekday: number;
  startTime: string;
  endTime: string;
  weekRange: string;
  teacher?: string;
  courseType?: string;
  credits?: number;
  homeworkDue?: string;
  examTime?: string;
}

export interface CourseFilter {
  weekday?: number;
  weekNumber?: number;
  buildingName?: string;
}
