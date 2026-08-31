import { useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";

export type SelectOption = { label: string; value: string };

export type OptionSource =
  | "years"
  | "classes"
  | "sections"
  | "staff"
  | "students"
  | "subjects"
  | "exams"
  | "feeHeads"
  | "vehicles";

const ENDPOINTS: Record<OptionSource, string> = {
  years: "/tenant/getallacademicyears",
  classes: "/tenant/getallclasses",
  sections: "/tenant/getallsections",
  staff: "/tenant/getallstaff",
  students: "/tenant/getallstudents",
  subjects: "/tenant/getallsubjects",
  exams: "/tenant/getallexams",
  feeHeads: "/tenant/getallfeeheads",
  vehicles: "/tenant/getallvehicles",
};

type AnyRow = Record<string, unknown>;

function pick(row: AnyRow, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return "";
}

// Normalizes heterogeneous backend rows into picker options.
const MAPPERS: Record<OptionSource, (row: AnyRow) => SelectOption | null> = {
  years: (r) => ({ label: pick(r, ["yearName", "year_name", "name"]), value: pick(r, ["id"]) }),
  classes: (r) => ({ label: pick(r, ["class_name", "className", "name"]), value: pick(r, ["id"]) }),
  sections: (r) => ({
    label: pick(r, ["sectionName", "section_name", "name"]),
    value: pick(r, ["id"]),
    // extra field used to filter sections by their parent class
    ...(pick(r, ["classId", "class_id", "ClassId"]) ? { classId: pick(r, ["classId", "class_id", "ClassId"]) } : {}),
  }) as SelectOption,
  staff: (r) => ({ label: pick(r, ["full_name", "fullName", "name", "first_name"]) || `Staff ${pick(r, ["id"])}`, value: pick(r, ["id"]) }),
  students: (r) => ({
    label:
      [pick(r, ["first_name", "firstName"]), pick(r, ["last_name", "lastName"])].filter(Boolean).join(" ") ||
      `Student ${pick(r, ["id"])}`,
    value: pick(r, ["id"]),
  }),
  subjects: (r) => ({ label: pick(r, ["subject_name", "subjectName", "name"]), value: pick(r, ["id"]) }),
  exams: (r) => ({ label: pick(r, ["exam_name", "examName", "name"]), value: pick(r, ["id"]) }),
  feeHeads: (r) => ({ label: pick(r, ["feeName", "fee_name", "name"]), value: pick(r, ["id"]) }),
  vehicles: (r) => ({ label: pick(r, ["vehicle_number", "vehicleNumber", "name"]) || `Vehicle ${pick(r, ["id"])}`, value: pick(r, ["id"]) }),
};

export function useSelectOptions(sources: OptionSource[]) {
  const key = sources.join(",");
  const [options, setOptions] = useState<Partial<Record<OptionSource, SelectOption[]>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const unique = Array.from(new Set(sources));
    (async () => {
      setLoading(true);
      const results: Partial<Record<OptionSource, SelectOption[]>> = {};
      await Promise.all(
        unique.map(async (src) => {
          try {
            const { data } = await apiClient.get<ApiResponse<AnyRow[]>>(ENDPOINTS[src]);
            const rows = Array.isArray(data.data) ? data.data : [];
            results[src] = rows
              .map(MAPPERS[src])
              .filter((o): o is SelectOption => !!o && o.value !== "" && o.label !== "");
          } catch {
            results[src] = [];
          }
        })
      );
      if (alive) {
        setOptions(results);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { options, loading };
}

// Sections belong to a class; filter client side when the class changes.
export function sectionsFor(options: Partial<Record<OptionSource, SelectOption[]>>, classValue: string): SelectOption[] {
  if (!classValue) return (options.sections ?? []) as SelectOption[];
  return ((options.sections ?? []) as (SelectOption & { classId?: string })[]).filter(
    (s) => !s.classId || s.classId === classValue
  );
}
