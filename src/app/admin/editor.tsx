import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DynamicModuleInput } from "../../components/admin/DynamicModuleInput";
import { ModulePickerSheet } from "../../components/admin/ModulePickerSheet";
import { getCurrentSession } from "../../services/auth.service";
import {
    createOrGetCategory,
    deleteCategory,
    fetchCategories,
} from "../../services/categories.service";
import {
    createProfile,
    fetchProfileById,
    updateProfile,
} from "../../services/profiles.service";
import type { Category, ModuleType, ProfileModule } from "../../types/profile";

function generateModuleId(): string {
  return `mod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const editingId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isEditing = Boolean(editingId);

  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Campos del formulario
  const [fullName, setFullName] = useState("");
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    [],
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Confirmación para borrar una categoría
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );
  const [deletingCategory, setDeletingCategory] = useState(false);

  const [modules, setModules] = useState<ProfileModule[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const session = await getCurrentSession();
        if (!session) {
          router.replace("/admin");
          return;
        }

        const [categoriesList, existingProfile] = await Promise.all([
          fetchCategories(),
          editingId ? fetchProfileById(editingId) : Promise.resolve(null),
        ]);

        if (!mounted) return;

        setAvailableCategories(categoriesList);

        if (editingId && !existingProfile) {
          setErrorMessage("No se encontró la ficha que intentas editar.");
        } else if (existingProfile) {
          setFullName(existingProfile.full_name);
          setSelectedCategoryIds(existingProfile.categories.map((c) => c.id));
          setModules(existingProfile.modules);
        }
      } catch (err) {
        if (!mounted) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Error cargando datos del editor.";
        setErrorMessage(msg);
      } finally {
        if (mounted) setInitializing(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [editingId, router]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/admin");
    }
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  }

  async function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    try {
      setErrorMessage(null);
      setCreatingCategory(true);
      const created = await createOrGetCategory(trimmed);

      setAvailableCategories((prev) => {
        if (prev.some((c) => c.id === created.id)) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });

      setSelectedCategoryIds((prev) =>
        prev.includes(created.id) ? prev : [...prev, created.id],
      );

      setNewCategoryName("");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo crear la categoría.";
      setErrorMessage(msg);
    } finally {
      setCreatingCategory(false);
    }
  }

  async function confirmDeleteCategory() {
    if (!categoryToDelete) return;

    try {
      setErrorMessage(null);
      setDeletingCategory(true);
      await deleteCategory(categoryToDelete.id);

      setAvailableCategories((prev) =>
        prev.filter((c) => c.id !== categoryToDelete.id),
      );
      setSelectedCategoryIds((prev) =>
        prev.filter((id) => id !== categoryToDelete.id),
      );
      setCategoryToDelete(null);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la categoría.";
      setErrorMessage(msg);
      setCategoryToDelete(null);
    } finally {
      setDeletingCategory(false);
    }
  }

  function handleSelectModuleType(type: ModuleType) {
    const nextModule: ProfileModule = {
      id: generateModuleId(),
      type,
      ...(type === "custom" ? { label: "" } : {}),
      value: "",
    };
    setModules((prev) => [...prev, nextModule]);
  }

  function handleUpdateModule(updated: ProfileModule) {
    setModules((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  function handleRemoveModule(moduleId: string) {
    setModules((prev) => prev.filter((item) => item.id !== moduleId));
  }

  async function handleSave() {
    const cleanName = fullName.trim();
    if (!cleanName) {
      setErrorMessage("El nombre completo es obligatorio.");
      return;
    }

    const invalidCustom = modules.find(
      (mod) =>
        mod.type === "custom" &&
        mod.value.trim().length > 0 &&
        !(mod.label && mod.label.trim().length > 0),
    );

    if (invalidCustom) {
      setErrorMessage(
        "Ponle un nombre a todas las secciones personalizadas que tengan contenido.",
      );
      return;
    }

    try {
      setErrorMessage(null);
      setSaving(true);

      const payload = {
        full_name: cleanName,
        categoryIds: selectedCategoryIds,
        modules,
      };

      if (editingId) {
        await updateProfile(editingId, payload);
      } else {
        await createProfile(payload);
      }

      handleBack();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo guardar la ficha.";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  }

  if (initializing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#F4F4F5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.wrapper}>
          <View style={styles.topBar}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressedSurface,
              ]}
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={20} color="#F4F4F5" />
              <Text style={styles.backText}>Volver</Text>
            </Pressable>

            <Text style={styles.topTitle}>
              {isEditing ? "Editar ficha" : "Nueva ficha"}
            </Text>

            <View style={styles.topSpacer} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#FCA5A5"
                />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* 1. Dato base obligatorio */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nombre completo *</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ej. María Alejandra Gómez"
                placeholderTextColor="#71717A"
                style={styles.nameInput}
              />
            </View>

            {/* 2. Categorías modulares reutilizables */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Categorías</Text>
                <Text style={styles.sectionHint}>
                  Elige una o varias · X para borrar
                </Text>
              </View>

              {availableCategories.length > 0 ? (
                <View style={styles.categoriesGrid}>
                  {availableCategories.map((cat) => {
                    const isSelected = selectedCategoryIds.includes(cat.id);
                    return (
                      <View
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          isSelected && styles.categoryChipActive,
                        ]}
                      >
                        <Pressable
                          onPress={() => toggleCategory(cat.id)}
                          style={styles.categoryToggleBtn}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isSelected }}
                        >
                          <Ionicons
                            name={isSelected ? "checkmark" : "add"}
                            size={15}
                            color={isSelected ? "#0F1115" : "#A1A1AA"}
                          />
                          <Text
                            style={[
                              styles.categoryChipText,
                              isSelected && styles.categoryChipTextActive,
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </Pressable>

                        <View
                          style={[
                            styles.chipDivider,
                            isSelected && styles.chipDividerActive,
                          ]}
                        />

                        <Pressable
                          onPress={() => setCategoryToDelete(cat)}
                          style={styles.categoryDeleteBtn}
                          accessibilityRole="button"
                          accessibilityLabel={`Eliminar categoría ${cat.name}`}
                        >
                          <Ionicons
                            name="close"
                            size={14}
                            color={isSelected ? "#52525B" : "#71717A"}
                          />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyCategoryHint}>
                  Aún no hay categorías guardadas. Crea la primera abajo.
                </Text>
              )}

              <View style={styles.newCategoryRow}>
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Nueva categoría (ej. Repuestos)..."
                  placeholderTextColor="#71717A"
                  style={styles.newCategoryInput}
                  onSubmitEditing={handleAddCategory}
                />
                <Pressable
                  onPress={handleAddCategory}
                  disabled={creatingCategory || !newCategoryName.trim()}
                  style={({ pressed }) => [
                    styles.addCategoryButton,
                    pressed && styles.pressedSurface,
                    (creatingCategory || !newCategoryName.trim()) &&
                      styles.buttonDisabled,
                  ]}
                  accessibilityRole="button"
                >
                  {creatingCategory ? (
                    <ActivityIndicator size="small" color="#F4F4F5" />
                  ) : (
                    <Text style={styles.addCategoryText}>+ Crear</Text>
                  )}
                </Pressable>
              </View>
            </View>

            {/* 3. Módulos dinámicos */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Secciones de la ficha</Text>
                <Text style={styles.sectionHint}>
                  {modules.length}{" "}
                  {modules.length === 1 ? "agregada" : "agregadas"}
                </Text>
              </View>

              {modules.length > 0 ? (
                <View style={styles.modulesList}>
                  {modules.map((mod) => (
                    <DynamicModuleInput
                      key={mod.id}
                      module={mod}
                      onChange={handleUpdateModule}
                      onRemove={handleRemoveModule}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyModulesBox}>
                  <Text style={styles.emptyModulesText}>
                    Aún no agregas campos adicionales. Presiona el botón de
                    abajo para añadir teléfono, WhatsApp, redes o cualquier dato
                    personalizado.
                  </Text>
                </View>
              )}

              <Pressable
                onPress={() => setPickerVisible(true)}
                style={({ pressed }) => [
                  styles.addModuleButton,
                  pressed && styles.pressedSurface,
                ]}
                accessibilityRole="button"
              >
                <Ionicons name="add-circle-outline" size={20} color="#60A5FA" />
                <Text style={styles.addModuleText}>Agregar sección</Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.bottomBar}>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
                saving && styles.buttonDisabled,
              ]}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#0F1115" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditing ? "Guardar cambios" : "Guardar ficha"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ModulePickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelectModuleType}
      />

      {/* Modal de confirmación para eliminar categoría */}
      <Modal
        visible={Boolean(categoryToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingCategory) {
            setCategoryToDelete(null);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Eliminar categoría</Text>
            <Text style={styles.modalText}>
              ¿Seguro que deseas borrar{" "}
              <Text style={styles.modalHighlight}>
                {categoryToDelete?.name}
              </Text>
              ? También se quitará de cualquier ficha que la tenga asignada.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setCategoryToDelete(null)}
                disabled={deletingCategory}
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  pressed && styles.pressedSurface,
                ]}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={confirmDeleteCategory}
                disabled={deletingCategory}
                style={({ pressed }) => [
                  styles.modalDeleteBtn,
                  pressed && styles.saveButtonPressed,
                ]}
              >
                {deletingCategory ? (
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
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  backButton: {
    minHeight: 44,
    paddingHorizontal: 10,
    marginLeft: -10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F4F4F5",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F4F4F5",
  },
  topSpacer: {
    width: 72,
  },
  pressedSurface: {
    backgroundColor: "#20242C",
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 32,
    gap: 24,
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
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F4F4F5",
  },
  sectionHint: {
    fontSize: 12,
    color: "#71717A",
  },
  nameInput: {
    minHeight: 50,
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "500",
    color: "#F4F4F5",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  categoryChipActive: {
    backgroundColor: "#F4F4F5",
    borderColor: "#F4F4F5",
  },
  categoryToggleBtn: {
    minHeight: 40,
    paddingLeft: 12,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A1A1AA",
  },
  categoryChipTextActive: {
    color: "#0F1115",
  },
  chipDivider: {
    width: 1,
    height: 18,
    backgroundColor: "#272B34",
  },
  chipDividerActive: {
    backgroundColor: "#D4D4D8",
  },
  categoryDeleteBtn: {
    minWidth: 34,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCategoryHint: {
    fontSize: 13,
    color: "#71717A",
  },
  newCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  newCategoryInput: {
    flex: 1,
    minHeight: 44,
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#F4F4F5",
  },
  addCategoryButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    alignItems: "center",
    justifyContent: "center",
  },
  addCategoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#60A5FA",
  },
  modulesList: {
    gap: 12,
  },
  emptyModulesBox: {
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 16,
    padding: 16,
  },
  emptyModulesText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#A1A1AA",
  },
  addModuleButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#1E3A8A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addModuleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#93C5FD",
  },
  bottomBar: {
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: "#0F1115",
    borderTopWidth: 1,
    borderTopColor: "#181B21",
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonPressed: {
    opacity: 0.88,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F1115",
  },
  buttonDisabled: {
    opacity: 0.5,
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
