import { Ionicons } from "@expo/vector-icons";
import type { Session } from "@supabase/supabase-js";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/ui/EmptyState";
import {
    getCurrentSession,
    signInAdmin,
    signOutAdmin,
    subscribeToAuthChanges,
} from "../../services/auth.service";
import { deleteProfile, fetchProfiles } from "../../services/profiles.service";
import type { Profile } from "../../types/profile";

export default function AdminScreen() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Estado del Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Estado del Panel de Fichas
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Estado para confirmar eliminación
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    getCurrentSession()
      .then((current) => {
        if (mounted) setSession(current);
      })
      .catch(() => {
        if (mounted) setSession(null);
      })
      .finally(() => {
        if (mounted) setCheckingSession(false);
      });

    const unsubscribe = subscribeToAuthChanges((nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const loadProfiles = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingProfiles(true);
      }
      setLoadError(null);
      const data = await fetchProfiles();
      setProfiles(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las fichas.";
      setLoadError(message);
    } finally {
      setLoadingProfiles(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (session) {
        loadProfiles(false);
      }
    }, [session, loadProfiles]),
  );

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return profiles;

    return profiles.filter((person) => {
      if (person.full_name.toLowerCase().includes(query)) return true;
      return person.categories.some((cat) =>
        cat.name.toLowerCase().includes(query),
      );
    });
  }, [profiles, searchQuery]);

  async function handleLogin() {
    try {
      setAuthError(null);
      setAuthLoading(true);
      const nextSession = await signInAdmin(email, password);
      setSession(nextSession);
      setPassword("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesión.";
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await signOutAdmin();
      setProfiles([]);
      setSession(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo cerrar sesión.";
      setLoadError(message);
    }
  }

  async function confirmDelete() {
    if (!profileToDelete) return;
    try {
      setDeleting(true);
      await deleteProfile(profileToDelete.id);
      setProfiles((prev) =>
        prev.filter((item) => item.id !== profileToDelete.id),
      );
      setProfileToDelete(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo eliminar la ficha.";
      setLoadError(message);
      setProfileToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  if (checkingSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#F4F4F5" />
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // VISTA 1: LOGIN DE ADMINISTRADOR
  // ============================================================
  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.wrapper}>
            <View style={styles.topBar}>
              <Pressable
                onPress={() => router.replace("/")}
                style={({ pressed }) => [
                  styles.ghostButton,
                  pressed && styles.pressedSurface,
                ]}
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={18} color="#F4F4F5" />
                <Text style={styles.ghostButtonText}>Directorio</Text>
              </Pressable>
            </View>

            <View style={styles.loginContainer}>
              <View style={styles.loginHeader}>
                <View style={styles.lockBadge}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={22}
                    color="#F4F4F5"
                  />
                </View>
                <Text style={styles.loginTitle}>Acceso Administrador</Text>
                <Text style={styles.loginSubtitle}>
                  Ingresa tus credenciales para crear, editar o eliminar fichas.
                </Text>
              </View>

              {authError ? (
                <View style={styles.errorBanner}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#FCA5A5"
                  />
                  <Text style={styles.errorBannerText}>{authError}</Text>
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Correo electrónico</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@correo.com"
                  placeholderTextColor="#71717A"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Contraseña</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#71717A"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={styles.passwordInput}
                    onSubmitEditing={handleLogin}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    accessibilityRole="button"
                    accessibilityLabel="Mostrar u ocultar contraseña"
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#A1A1AA"
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={handleLogin}
                disabled={authLoading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  authLoading && styles.buttonDisabled,
                ]}
                accessibilityRole="button"
              >
                {authLoading ? (
                  <ActivityIndicator size="small" color="#0F1115" />
                ) : (
                  <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // VISTA 2: PANEL DE GESTIÓN (AUTENTICADO)
  // ============================================================
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.wrapper}>
        <View style={styles.adminTopBar}>
          <Pressable
            onPress={() => router.replace("/")}
            style={({ pressed }) => [
              styles.ghostButton,
              pressed && styles.pressedSurface,
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="eye-outline" size={18} color="#A1A1AA" />
            <Text style={styles.ghostButtonMutedText}>Ver público</Text>
          </Pressable>

          <Text style={styles.topBarTitle}>Panel Admin</Text>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.ghostButton,
              pressed && styles.pressedSurface,
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={18} color="#FCA5A5" />
            <Text style={styles.logoutText}>Salir</Text>
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#71717A" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar ficha para editar..."
            placeholderTextColor="#71717A"
            style={styles.searchInput}
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <Pressable
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
              accessibilityRole="button"
            >
              <Ionicons name="close-circle" size={18} color="#71717A" />
            </Pressable>
          ) : null}
        </View>

        {loadingProfiles && profiles.length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#F4F4F5" />
          </View>
        ) : loadError && profiles.length === 0 ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Error cargando fichas"
            description={loadError}
            actionLabel="Reintentar"
            onAction={() => loadProfiles(false)}
          />
        ) : (
          <FlatList
            data={filteredProfiles}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadProfiles(true)}
                tintColor="#F4F4F5"
              />
            }
            renderItem={({ item }) => {
              const catLabel =
                item.categories.length > 0
                  ? item.categories.map((c) => c.name).join(" · ")
                  : "Sin categoría";
              const modCount = item.modules.length;

              return (
                <View style={styles.adminCard}>
                  <View style={styles.adminCardInfo}>
                    <Text style={styles.adminCardName} numberOfLines={1}>
                      {item.full_name}
                    </Text>
                    <Text style={styles.adminCardMeta} numberOfLines={1}>
                      {catLabel} · {modCount}{" "}
                      {modCount === 1 ? "sección" : "secciones"}
                    </Text>
                  </View>

                  <View style={styles.adminActions}>
                    <Pressable
                      onPress={() => router.push(`/admin/editor?id=${item.id}`)}
                      style={({ pressed }) => [
                        styles.iconActionButton,
                        pressed && styles.pressedSurface,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Editar ${item.full_name}`}
                    >
                      <Ionicons
                        name="create-outline"
                        size={19}
                        color="#F4F4F5"
                      />
                    </Pressable>

                    <Pressable
                      onPress={() => setProfileToDelete(item)}
                      style={({ pressed }) => [
                        styles.iconActionButton,
                        pressed && styles.pressedSurface,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar ${item.full_name}`}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={19}
                        color="#F87171"
                      />
                    </Pressable>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title={
                  searchQuery.trim()
                    ? "Sin coincidencias"
                    : "No hay personas creadas"
                }
                description={
                  searchQuery.trim()
                    ? "Prueba con otro nombre o categoría."
                    : 'Toca "+ Nueva ficha" abajo para agregar la primera persona.'
                }
              />
            }
          />
        )}

        <View style={styles.bottomBar}>
          <Pressable
            onPress={() => router.push("/admin/editor")}
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.primaryButtonPressed,
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={20} color="#0F1115" />
            <Text style={styles.primaryButtonText}>Nueva ficha</Text>
          </Pressable>
        </View>
      </View>

      {/* Modal de confirmación multiplataforma (Web + Móvil) */}
      <Modal
        visible={Boolean(profileToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) {
            setProfileToDelete(null);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Eliminar ficha</Text>
            <Text style={styles.modalText}>
              ¿Seguro que deseas eliminar a{" "}
              <Text style={styles.modalHighlight}>
                {profileToDelete?.full_name}
              </Text>
              ? Esta acción no se puede deshacer.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setProfileToDelete(null)}
                disabled={deleting}
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  pressed && styles.pressedSurface,
                ]}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={confirmDelete}
                disabled={deleting}
                style={({ pressed }) => [
                  styles.modalDeleteBtn,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#0F1115" />
                ) : (
                  <Text style={styles.modalDeleteText}>Eliminar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: "#0F1115",
  },
  wrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  adminTopBar: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F4F4F5",
  },
  ghostButton: {
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ghostButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F4F4F5",
  },
  ghostButtonMutedText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#A1A1AA",
  },
  logoutText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FCA5A5",
  },
  pressedSurface: {
    backgroundColor: "#20242C",
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 48,
    gap: 16,
  },
  loginHeader: {
    gap: 8,
    marginBottom: 8,
  },
  lockBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F4F4F5",
    letterSpacing: -0.3,
  },
  loginSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#A1A1AA",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2B161B",
    borderWidth: 1,
    borderColor: "#7F1D1D",
    borderRadius: 12,
    padding: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#FCA5A5",
  },
  formGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A1A1AA",
  },
  input: {
    minHeight: 48,
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#F4F4F5",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 6,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: "#F4F4F5",
    paddingVertical: 10,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F1115",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 46,
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 8,
    marginTop: 4,
    marginBottom: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#F4F4F5",
    paddingVertical: 10,
  },
  clearButton: {
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 96,
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
  adminCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    gap: 8,
  },
  adminCardInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  adminCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F4F4F5",
  },
  adminCardMeta: {
    fontSize: 12,
    color: "#A1A1AA",
  },
  adminActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  iconActionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: "#0F1115",
    borderTopWidth: 1,
    borderTopColor: "#181B21",
  },
  createButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "#F4F4F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F4F4F5",
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#A1A1AA",
  },
  modalHighlight: {
    color: "#F4F4F5",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#20242C",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F4F4F5",
  },
  modalDeleteBtn: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#F87171",
    alignItems: "center",
    justifyContent: "center",
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F1115",
  },
});
