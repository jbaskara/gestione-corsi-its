import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Modelli opzionali per tipizzare meglio (nessun impatto UI)
export interface ModuleSnapshot {
  nome: string;
  codice: string;
  ore_totali: number;
  descrizione?: string;
}
export interface ModuleDto {
  id: string;
  nome: string;
  codice: string;
  ore_totali: number;
  descrizione?: string;
  studenti_ids?: string[];
}
export interface StudentDto {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  modules_ids?: string[];
}
export interface ExamDto {
  id: string;
  student_id: string;
  module_id: string;
  modulo_snapshot: ModuleSnapshot;
  data: string; // YYYY-MM-DD
  voto: number;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Moduli
  listModules(): Observable<ModuleDto[]> {
    return this.http.get<ModuleDto[]>('/api/modules');
  }
  getModule(id: string): Observable<ModuleDto> {
    return this.http.get<ModuleDto>(`/api/modules/${id}`);
  }
  createModule(data: Partial<ModuleDto>): Observable<ModuleDto> {
    return this.http.post<ModuleDto>('/api/modules', data);
  }
  updateModule(id: string, data: Partial<ModuleDto>): Observable<ModuleDto> {
    return this.http.put<ModuleDto>(`/api/modules/${id}`, data);
  }
  deleteModule(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/modules/${id}`);
  }

  // Studenti
  listStudents(): Observable<StudentDto[]> {
    return this.http.get<StudentDto[]>('/api/students');
  }
  getStudent(id: string): Observable<StudentDto> {
    return this.http.get<StudentDto>(`/api/students/${id}`);
  }
  createStudent(data: Partial<StudentDto>): Observable<StudentDto> {
    return this.http.post<StudentDto>('/api/students', data);
  }
  updateStudent(id: string, data: Partial<StudentDto>): Observable<StudentDto> {
    return this.http.put<StudentDto>(`/api/students/${id}`, data);
  }
  deleteStudent(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/students/${id}`);
  }

  // Iscrizione modulo (aggiornamento automatico riferimenti student/module lato backend)
  assignModule(studentId: string, moduleId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`/api/students/${studentId}/assign-module/${moduleId}`, {});
  }

  // Media voti e esami filtrati (>= 24)
  studentAverage(studentId: string): Observable<{ average: number | null; count: number }> {
    return this.http.get<{ average: number | null; count: number }>(`/api/students/${studentId}/average`);
  }

  // Convenienze per UI
  listExamsByStudent(studentId: string): Observable<ExamDto[]> {
    return this.listExams().pipe(map(all => (all || []).filter(e => e.student_id === studentId)));
  }
  listHighExamsByStudent(studentId: string, minScore = 24): Observable<{ items: ExamDto[] }> {
    return this.http.get<{ items: ExamDto[] }>(`/api/students/${studentId}/exams?min_score=${encodeURIComponent(minScore)}`);
  }

  // Esami
  listExams(): Observable<ExamDto[]> {
    return this.http.get<ExamDto[]>('/api/exams');
  }
  getExam(id: string): Observable<ExamDto> {
    return this.http.get<ExamDto>(`/api/exams/${id}`);
  }

  // Normalizza payload esame per data e snapshot (storico coerente)
  private normalizeExamPayload(payload: any): any {
    const normalizeDate = (d: any): string => {
      if (!d) return '';
      // Se arriva un Date o stringa ISO lunga, riduco a YYYY-MM-DD
      const obj = typeof d === 'string' ? new Date(d) : d;
      const yyyy = obj.getFullYear();
      const mm = String(obj.getMonth() + 1).padStart(2, '0');
      const dd = String(obj.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const data = payload?.data ?? payload?.data_esame ?? payload?.date;
    return { ...payload, data: normalizeDate(data) };
  }

  createExam(data: any): Observable<ExamDto> {
    return this.http.post<ExamDto>('/api/exams', this.normalizeExamPayload(data));
  }
  updateExam(id: string, data: any): Observable<ExamDto> {
    return this.http.put<ExamDto>(`/api/exams/${id}`, this.normalizeExamPayload(data));
  }
  deleteExam(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/exams/${id}`);
  }
}