export interface Permission {
  module: string;
  actions: string[];
}

export interface RoleInfo {
  id: string;
  name: string;
}

export interface AcademicYear {
  id: string;
  yearName: string;
}

export interface ParentInfo {
  id: string;
  father_name?: string | null;
  mother_name?: string | null;
  father_email?: string | null;
  mother_email?: string | null;
}

export interface MarketingExecutive {
  id: string;
  name: string;
  phone: string;
  role?: string | null;
}

// One session shape per usertype — this is the concrete answer to "based on
// the login, after usertype, show that user's things": everything downstream
// (navigation, home screen, available features) branches on `session.type`.
export type Session =
  | {
      type: "staff";
      token: string;
      userId: string;
      schoolcode: string;
      name?: string;
      userType: string;
      role: RoleInfo | null;
      permissions: Permission[];
      academicYear: AcademicYear | null;
    }
  | {
      type: "parent";
      token: string;
      userId: string;
      schoolcode: string;
      name?: string;
      parent?: ParentInfo;
    }
  | {
      type: "marketing";
      token: string;
      executive: MarketingExecutive;
    }
  | {
      type: "superadmin";
      token: string;
      email: string;
      role: string;
      permissions: Permission[];
    };
