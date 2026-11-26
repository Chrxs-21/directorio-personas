import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export async function signInAdmin(
  email: string,
  password: string,
): Promise<Session> {
  const cleanEmail = email.trim();
  if (!cleanEmail || !password) {
    throw new Error("Ingresa tu correo y contraseña.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      throw new Error("Correo o contraseña incorrectos.");
    }
    throw new Error(`No se pudo iniciar sesión: ${error.message}`);
  }

  if (!data.session) {
    throw new Error("No se recibió una sesión válida.");
  }

  return data.session;
}

export async function signOutAdmin(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`No se pudo cerrar sesión: ${error.message}`);
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(`Error verificando sesión: ${error.message}`);
  }
  return data.session;
}

export function subscribeToAuthChanges(
  callback: (session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => {
    data.subscription.unsubscribe();
  };
}
