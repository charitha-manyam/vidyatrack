export interface AcademicYearFull {
  id: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AcademicYearFormValues {
  yearName: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}
