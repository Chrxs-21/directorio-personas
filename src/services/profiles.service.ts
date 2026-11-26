import type {
  Category,
  Profile,
  ProfileInput,
  ProfileModule,
} from "../types/profile";
import { supabase } from "./supabase";

const TABLE_NAME = "profiles";
const JUNCTION_TABLE = "profile_categories";

const PROFILE_SELECT = `
  id,
  full_name,
  avatar_url,
  modules,
  created_at,
  updated_at,
  profile_categories (
    categories (
      id,
      name
    )
  )
`;

function normalizeModules(raw: unknown): ProfileModule[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is ProfileModule =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as ProfileModule).id === "string" &&
      typeof (item as ProfileModule).type === "string" &&
      typeof (item as ProfileModule).value === "string",
  );
}

function normalizeCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw)) return [];

  const result: Category[] = [];
  for (const link of raw) {
    if (!link || typeof link !== "object") continue;
    const nested = (link as { categories?: unknown }).categories;
    const items = Array.isArray(nested) ? nested : [nested];

    for (const cat of items) {
      if (
        cat &&
        typeof cat === "object" &&
        typeof (cat as Category).id === "string" &&
        typeof (cat as Category).name === "string"
      ) {
        result.push({
          id: (cat as Category).id,
          name: (cat as Category).name,
        });
      }
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    full_name: String(row.full_name ?? ""),
    avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
    categories: normalizeCategories(row.profile_categories),
    modules: normalizeModules(row.modules),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function sanitizeInput(input: ProfileInput): ProfileInput {
  const fullName = input.full_name.trim();
  if (!fullName) {
    throw new Error("El nombre completo es obligatorio.");
  }

  const cleanModules = input.modules
    .map((mod) => ({
      id: mod.id,
      type: mod.type,
      ...(mod.label?.trim() ? { label: mod.label.trim() } : {}),
      value: mod.value.trim(),
    }))
    .filter((mod) => mod.value.length > 0);

  const cleanCategoryIds = Array.from(
    new Set(input.categoryIds.filter(Boolean)),
  );

  return {
    full_name: fullName,
    categoryIds: cleanCategoryIds,
    modules: cleanModules,
  };
}

async function syncProfileCategories(
  profileId: string,
  categoryIds: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from(JUNCTION_TABLE)
    .delete()
    .eq("profile_id", profileId);

  if (deleteError) {
    throw new Error(
      `No se pudieron actualizar las categorías: ${deleteError.message}`,
    );
  }

  if (categoryIds.length === 0) return;

  const rows = categoryIds.map((categoryId) => ({
    profile_id: profileId,
    category_id: categoryId,
  }));

  const { error: insertError } = await supabase
    .from(JUNCTION_TABLE)
    .insert(rows);

  if (insertError) {
    throw new Error(
      `No se pudieron asignar las categorías: ${insertError.message}`,
    );
  }
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(PROFILE_SELECT)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(`No se pudo cargar el directorio: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    normalizeProfile(row as Record<string, unknown>),
  );
}

export async function fetchProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(PROFILE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar la ficha: ${error.message}`);
  }

  return data ? normalizeProfile(data as Record<string, unknown>) : null;
}

export async function createProfile(input: ProfileInput): Promise<Profile> {
  const payload = sanitizeInput(input);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      full_name: payload.full_name,
      modules: payload.modules,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `No se pudo crear la ficha: ${error?.message ?? "Error desconocido"}`,
    );
  }

  await syncProfileCategories(String(data.id), payload.categoryIds);

  const created = await fetchProfileById(String(data.id));
  if (!created) {
    throw new Error("La ficha se creó, pero no pudo leerse.");
  }
  return created;
}

export async function updateProfile(
  id: string,
  input: ProfileInput,
): Promise<Profile> {
  const payload = sanitizeInput(input);

  const { error } = await supabase
    .from(TABLE_NAME)
    .update({
      full_name: payload.full_name,
      modules: payload.modules,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar la ficha: ${error.message}`);
  }

  await syncProfileCategories(id, payload.categoryIds);

  const updated = await fetchProfileById(id);
  if (!updated) {
    throw new Error("No se encontró la ficha actualizada.");
  }
  return updated;
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    throw new Error(`No se pudo eliminar la ficha: ${error.message}`);
  }
}
