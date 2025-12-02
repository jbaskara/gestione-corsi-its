import { Routes } from '@angular/router';
import { DashboardPage } from './dashboard/dashboard.page';
import { ModulesPage } from './modules/modules.page';
import { ModuleFormPage } from './modules/module-form.page';
import { ExamsPage } from './exams/exams.page';
import { ExamsFormPage } from './exams/exams-form.page';
import { StudentsPage } from './students/students.page';
import { StudentFormPage } from './students/student-form.page';
import { StudentDetailPage } from './students/student-detail.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardPage },

  // Moduli
  { path: 'modules/new', component: ModuleFormPage },
  { path: 'modules/:id/edit', component: ModuleFormPage },
  { path: 'modules', component: ModulesPage },

  // Esami
  { path: 'exams/new', component: ExamsFormPage },
  { path: 'exams/:id/edit', component: ExamsFormPage },
  { path: 'exams', component: ExamsPage },

  // Studenti
  { path: 'students/new', component: StudentFormPage },
  { path: 'students/:id/edit', component: StudentFormPage },
  { path: 'students/:id', component: StudentDetailPage },
  { path: 'students', component: StudentsPage },

  { path: '**', redirectTo: 'dashboard' }
];