export interface MarketingDashboard {
  status: boolean;
  target: { visits: number; leads: number; admissions: number; revenue: number };
  achieved: { visits: number; leads: number; admissions: number; revenue: number };
  remaining: { visits: number; leads: number; admissions: number; revenue: number };
  completion: { visits: string; leads: string; admissions: string; revenue: string };
}
