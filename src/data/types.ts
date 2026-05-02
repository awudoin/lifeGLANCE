export type DatePrecision = "day" | "month" | "year";
export type MediaType = "audio" | "video" | null;

export interface FrontendMilestone {
  id: string;
  title: string;
  date: string;
  date_precision: DatePrecision;
  direction: string;
  category: string;
  color: string;
  note: string;
  photo_uri: string;
  media_type: MediaType;
  url: string;
  recurrence: string | null;
  recurrence_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FrontendMilestoneInput {
  id?: string;
  title: string;
  date: Date | string;
  date_precision?: DatePrecision;
  category?: string;
  color?: string;
  note?: string;
  photo_uri?: string;
  media_type?: MediaType;
  url?: string;
  recurrence?: string | null;
  recurrence_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ServerMilestone {
  id: string;
  title: string;
  date: string;
  datePrecision: DatePrecision;
  direction: string;
  categoryId: string;
  color: string;
  note: string;
  url: string;
  recurrence: string | null;
  recurrenceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServerMilestoneInput {
  id?: string;
  title: string;
  date: string;
  datePrecision: DatePrecision;
  direction: string;
  categoryId: string;
  color: string;
  note?: string;
  url?: string;
  recurrence?: string | null;
  recurrenceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryRecord {
  id: string;
  label: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IcsCandidate {
  key: number;
  title: string;
  date: Date;
  note: string;
  url: string;
  category: string;
  isRecurring: boolean;
  selected: boolean;
}

export interface IcsParseResult {
  candidates: IcsCandidate[];
  timedCount: number;
}

export interface SettingRecord {
  key: string;
  value: string;
  updatedAt?: string;
}

export interface BootstrapResponse {
  milestones: ServerMilestone[];
  categories: CategoryRecord[];
  settings: SettingRecord[];
}
