import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type {
  FleetVehicleLocation,
  RouteStudent,
  TransportFee,
  TransportFeeFormValues,
  TransportRoute,
  TransportRouteFormValues,
  Vehicle,
  VehicleAssignment,
  VehicleAssignmentFormValues,
  VehicleFormValues,
} from "../types/transport";

// ---------------- Transport Routes (fee slabs) ----------------
export async function getTransportRoutes(): Promise<TransportRoute[]> {
  const { data } = await apiClient.get<ApiResponse<TransportRoute[]>>("/tenant/getalltransportroutes");
  return data.data ?? [];
}

export async function getTransportRouteById(id: string): Promise<TransportRoute | undefined> {
  const { data } = await apiClient.get<ApiResponse<TransportRoute>>(`/tenant/gettransportrouteById/${id}`);
  return data.data;
}

export async function createTransportRoute(values: TransportRouteFormValues) {
  const { data } = await apiClient.post<ApiResponse<TransportRoute>>("/tenant/addtransportroute", values);
  return data;
}

export async function updateTransportRoute(id: string, values: Partial<TransportRouteFormValues>) {
  const { data } = await apiClient.put<ApiResponse<TransportRoute>>(`/tenant/updatetransportrouteById/${id}`, values);
  return data;
}

export async function deleteTransportRoute(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deletetransportrouteById/${id}`);
  return data;
}

// ---------------- Student transport assignment ----------------
export async function assignStudentTransport(studentId: string, slabId: string) {
  const { data } = await apiClient.post<ApiResponse>("/tenant/assignstudenttransport", { studentId, slabId });
  return data;
}

export async function getStudentsByRoute(routeId: string): Promise<RouteStudent[]> {
  const { data } = await apiClient.get<ApiResponse<RouteStudent[]>>(`/tenant/getstudentsbyroute/${routeId}`);
  return data.data ?? [];
}

export async function removeStudentTransport(studentId: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/removestudenttransport/${studentId}`);
  return data;
}

// ---------------- Vehicles ----------------
export async function getVehicles(): Promise<Vehicle[]> {
  const { data } = await apiClient.get<ApiResponse<Vehicle[]>>("/tenant/getallvehicles");
  return data.data ?? [];
}

export async function getVehicleById(id: string): Promise<Vehicle | undefined> {
  const { data } = await apiClient.get<ApiResponse<Vehicle>>(`/tenant/getvehicleById/${id}`);
  return data.data;
}

export async function createVehicle(values: VehicleFormValues) {
  const { data } = await apiClient.post<ApiResponse<Vehicle>>("/tenant/createvehicle", values);
  return data;
}

export async function updateVehicle(id: string, values: Partial<VehicleFormValues>) {
  const { data } = await apiClient.put<ApiResponse<Vehicle>>(`/tenant/updatevehicleById/${id}`, values);
  return data;
}

export async function deleteVehicle(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deletevehicleById/${id}`);
  return data;
}

// ---------------- Vehicle assignments ----------------
export async function getVehicleAssignments(): Promise<VehicleAssignment[]> {
  const { data } = await apiClient.get<ApiResponse<VehicleAssignment[]>>("/tenant/getvehicleassignments");
  return data.data ?? [];
}

export async function assignVehicle(values: VehicleAssignmentFormValues) {
  const { data } = await apiClient.post<ApiResponse<VehicleAssignment>>("/tenant/assignvehicle", values);
  return data;
}

export async function removeVehicleAssignment(vehicleId: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/removevehicleassignment/${vehicleId}`);
  return data;
}

// ---------------- Transport fees ----------------
export async function getTransportFees(academicYearId?: string): Promise<TransportFee[]> {
  const { data } = await apiClient.get<ApiResponse<TransportFee[]>>("/tenant/getalltransportfees", {
    params: academicYearId ? { academicYearId } : undefined,
  });
  return data.data ?? [];
}

export async function getTransportFeeById(id: string): Promise<TransportFee | undefined> {
  const { data } = await apiClient.get<ApiResponse<TransportFee>>(`/tenant/gettransportfeeById/${id}`);
  return data.data;
}

export async function createTransportFee(values: TransportFeeFormValues) {
  const { data } = await apiClient.post<ApiResponse<TransportFee>>("/tenant/addtransportfee", values);
  return data;
}

export async function updateTransportFee(id: string, values: Partial<TransportFeeFormValues>) {
  const { data } = await apiClient.put<ApiResponse<TransportFee>>(`/tenant/updatetransportfeeById/${id}`, values);
  return data;
}

export async function deleteTransportFee(id: string) {
  const { data } = await apiClient.delete<ApiResponse>(`/tenant/deletetransportfeeById/${id}`);
  return data;
}

// ---------------- Live vehicle locations ----------------
export async function getAllVehicleLocations(): Promise<FleetVehicleLocation[]> {
  const { data } = await apiClient.get<ApiResponse<FleetVehicleLocation[]>>("/tenant/getallvehiclelocations");
  return data.data ?? [];
}