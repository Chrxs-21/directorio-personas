export type ModuleType =
  | "phone"
  | "whatsapp"
  | "instagram"
  | "email"
  | "location"
  | "description"
  | "website"
  | "custom";

export interface ProfileModule {
  id: string;
  type: ModuleType;
  label?: string;
  value: string;
}

export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  categories: Category[];
  modules: ProfileModule[];
  created_at: string;
  updated_at: string;
}

export interface ProfileInput {
  full_name: string;
  categoryIds: string[];
  modules: ProfileModule[];
}
