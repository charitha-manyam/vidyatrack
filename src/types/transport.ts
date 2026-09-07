// Transport module types — mirror admin-portal/src/types/{transport,vehicle,
// vehicleAssignment,vehicleLocation}.ts + the backend tenant models. Field
// naming follows the backend (snake_case for entity columns, camelCase for
// junction keys like slabId/schoolCode/academicYearId).

export interface TransportRoute {
  id: string;
  name: string;
  fromkm?: number | null;
  tokm?: number | null;
  monthlyfee?: number | null;
  annuallyfee?: number | null;
  assignedStudentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransportRouteFormValues {
  name: string;
  fromkm?: number | null;
  tokm?: number | null;
  monthlyfee?: number | null;
  annuallyfee?: number | null;
}

export interface RouteStudent {
  studentTransportId: string;
  studentId: string;
  studentName: string | null;
  rollNumber: string | null;
  classId: string | null;
  sectionId: string | null;
}

export const VEHICLE_STATUSES = ["active", "maintenance", "inactive"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export interface VehicleAssignmentSummary {
  id: string;
  vehicleId: string;
  slabId: string;
  driverStaffId: string;
  schoolCode: string;
  academicYearId?: string | null;
  route?: { id: string; name: string } | null;
  driver?: { id: string; name: string; phone: string } | null;
}

export interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type?: string | null;
  capacity?: number | null;
  model?: string | null;
  status: VehicleStatus;
  school_code: string;
  academicYearId?: string | null;
  assignment?: VehicleAssignmentSummary | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleFormValues {
  vehicle_number: string;
  vehicle_type?: string;
  capacity?: number;
  model?: string;
  status?: VehicleStatus;
  school_code: string;
  academicYearId?: string;
}

export interface VehicleAssignment {
  id: string;
  vehicleId: string;
  slabId: string;
  driverStaffId: string;
  schoolCode: string;
  academicYearId?: string | null;
  vehicle?: { id: string; vehicle_number: string } | null;
  route?: { id: string; name: string } | null;
  driver?: { id: string; name: string; phone: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleAssignmentFormValues {
  vehicleId: string;
  slabId: string;
  driverStaffId: string;
  schoolCode: string;
  academicYearId?: string;
}

export interface TransportFee {
  id: string;
  feehead_id: string;
  slab_name: string;
  from_km?: number | null;
  to_km?: number | null;
  student_id: string;
  section_id: string;
  class_id: string;
  monthly_fee?: number | null;
  annual_fee?: number | null;
  academicYearId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  feeHeadName?: string | null;
  studentName?: string | null;
  sectionName?: string | null;
  className?: string | null;
}

export interface TransportFeeFormValues {
  feehead_id: string;
  student_id: string;
  section_id: string;
  class_id: string;
  slab_name?: string;
  from_km?: number | null;
  to_km?: number | null;
  monthly_fee?: number | null;
  annual_fee?: number | null;
  academicYearId?: string;
}

export interface FleetVehicleLocation {
  vehicleId: string;
  vehicle_number: string;
  routeName: string | null;
  driverName: string | null;
  driverPhone: string | null;
  latitude: number | null;
  longitude: number | null;
  is_trip_active: boolean;
  recorded_at: string | null;
}