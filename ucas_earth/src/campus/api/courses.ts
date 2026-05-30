import type { Course, CourseCreateInput, CourseUpdateInput, CourseImportRow, CourseFilter } from '../types/courses';

const API_BASE = '/api/courses';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function listCourses(filter?: CourseFilter): Promise<Course[]> {
  const params = new URLSearchParams();
  if (filter?.weekday) params.append('weekday', filter.weekday.toString());
  if (filter?.weekNumber) params.append('weekNumber', filter.weekNumber.toString());
  if (filter?.buildingName) params.append('buildingName', filter.buildingName);
  const query = params.toString();
  const url = query ? `${API_BASE}?${query}` : API_BASE;
  return request<Course[]>(url);
}

export async function getTodayCourses(): Promise<Course[]> {
  return request<Course[]>(`${API_BASE}/today`);
}

export async function getCoursesByWeek(weekNumber: number): Promise<Course[]> {
  return request<Course[]>(`${API_BASE}/week/${weekNumber}`);
}

export async function getCoursesByBuilding(buildingName: string): Promise<Course[]> {
  return request<Course[]>(`${API_BASE}/building/${encodeURIComponent(buildingName)}`);
}

export async function createCourse(input: CourseCreateInput): Promise<Course> {
  return request<Course>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateCourse(input: CourseUpdateInput): Promise<Course> {
  return request<Course>(`${API_BASE}/${input.id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteCourse(id: number): Promise<void> {
  await request<void>(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
}

export async function importCourses(rows: CourseImportRow[]): Promise<{ success: number; errors: string[] }> {
  return request<{ success: number; errors: string[] }>(`${API_BASE}/import`, {
    method: 'POST',
    body: JSON.stringify(rows),
  });
}

export async function downloadTemplate(): Promise<Blob> {
  const response = await fetch(`${API_BASE}/template`);
  if (!response.ok) {
    throw new Error('Failed to download template');
  }
  return response.blob();
}
