import type { Category } from "../types/profile";
import { supabase } from "./supabase";

const TABLE_NAME = "categories";

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar las categorías: ${error.message}`);
  }

  return (data ?? []) as Category[];
}

export async function createOrGetCategory(name: string): Promise<Category> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Escribe un nombre para la categoría.");
  }

  const { data: existing, error: findError } = await supabase
    .from(TABLE_NAME)
    .select("id, name, created_at")
    .ilike("name", cleanName)
    .maybeSingle();

  if (findError) {
    throw new Error(`Error buscando categoría: ${findError.message}`);
  }

  if (existing) {
    return existing as Category;
  }

  const { data, error: insertError } = await supabase
    .from(TABLE_NAME)
    .insert({ name: cleanName })
    .select("id, name, created_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: retry } = await supabase
        .from(TABLE_NAME)
        .select("id, name, created_at")
        .ilike("name", cleanName)
        .maybeSingle();
      if (retry) return retry as Category;
    }
    throw new Error(`No se pudo crear la categoría: ${insertError.message}`);
  }

  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
  if (error) {
    throw new Error(`No se pudo eliminar la categoría: ${error.message}`);
  }
}
