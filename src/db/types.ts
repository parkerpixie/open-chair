import type { Feeling } from "../features/check-in/catalog";
export interface Dated {
  id: string;
  local_date: string;
  created_at: string;
  demo: number;
}
export interface CheckIn extends Dated {
  intensity: number | null;
  note: string;
  feelings: Feeling[];
}
export interface Reflection extends Dated {
  text: string;
}
export interface ToolSession extends Dated {
  tool_id: string;
  check_in_id: string | null;
  responses: string;
}
export interface Takeaway extends Reflection {
  support_id: string | null;
}
export interface Support {
  id: string;
  name: string;
  type: string;
  mode: string;
  weekdays: number[];
  time: string;
  url: string;
  location: string;
  phone: string;
  meeting_id: string;
  passcode: string;
  notes: string;
  favorite: number;
  active: number;
  reminder_offset: number | null;
  created_at: string;
  updated_at: string;
}
export interface History {
  checkIns: CheckIn[];
  reflections: Reflection[];
  sessions: ToolSession[];
  takeaways: Takeaway[];
}
