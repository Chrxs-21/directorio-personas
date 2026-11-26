import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PersonCard } from "../components/public/PersonCard";
import { EmptyState } from "../components/ui/EmptyState";
import { fetchProfiles } from "../services/profiles.service";
import type { Profile } from "../types/profile";

interface CategoryFilterItem {
  id: string;
  name: string;
  count: number;
}

export default function PublicDirectoryScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await fetchProfiles();
      setProfiles(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al cargar.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfiles(false);
    }, [loadProfiles]),
  );

  const categoryFilters = useMemo<CategoryFilterItem[]>(() => {
    const countsMap = new Map<string, CategoryFilterItem>();

    for (const person of profiles) {
      for (const cat of person.categories) {
        const existing = countsMap.get(cat.id);
        if (existing) {
          existing.count += 1;
        } else {
          countsMap.set(cat.id, {
            id: cat.id,
            name: cat.name,
            count: 1,
          });
        }
      }
    }

    return Array.from(countsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [profiles]);

  useEffect(() => {
    if (
      selectedCategoryId &&
      !categoryFilters.some((cat) => cat.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(null);
    }
  }, [categoryFilters, selectedCategoryId]);

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return profiles.filter((person) => {
      if (
        selectedCategoryId &&
        !person.categories.some((cat) => cat.id === selectedCategoryId)
      ) {
        return false;
      }

      if (!query) return true;

      if (person.full_name.toLowerCase().includes(query)) return true;
      if (
        person.categories.some((cat) => cat.name.toLowerCase().includes(query))
      ) {
        return true;
      }
      return person.modules.some(
        (mod) =>
          mod.value.toLowerCase().includes(query) ||
          (mod.label && mod.label.toLowerCase().includes(query)),
      );
    });
  }, [profiles, selectedCategoryId, searchQuery]);

  function handleOpenPerson(profile: Profile) {
    router.push(`/person/${profile.id}`);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.title}>Directorio</Text>
          <Text style={styles.subtitle}>
            {loading
              ? "Cargando fichas..."
              : `${filteredProfiles.length} ${
                  filteredProfiles.length === 1
                    ? "persona registrada"
                    : "personas registradas"
                }`}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#71717A" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre o categoría..."
            placeholderTextColor="#71717A"
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <Pressable
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
            >
              <Ionicons name="close-circle" size={18} color="#71717A" />
            </Pressable>
          ) : null}
        </View>

        {categoryFilters.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryRow}
          >
            <Pressable
              onPress={() => setSelectedCategoryId(null)}
              style={[
                styles.filterButton,
                selectedCategoryId === null && styles.filterButtonActive,
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategoryId === null && styles.filterTextActive,
                ]}
              >
                Todas{" "}
                <Text
                  style={[
                    styles.filterCount,
                    selectedCategoryId === null && styles.filterCountActive,
                  ]}
                >
                  {profiles.length}
                </Text>
              </Text>
            </Pressable>

            {categoryFilters.map((cat) => {
              const isActive = selectedCategoryId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() =>
                    setSelectedCategoryId((prev) =>
                      prev === cat.id ? null : cat.id,
                    )
                  }
                  style={[
                    styles.filterButton,
                    isActive && styles.filterButtonActive,
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.filterText,
                      isActive && styles.filterTextActive,
                    ]}
                  >
                    {cat.name}{" "}
                    <Text
                      style={[
                        styles.filterCount,
                        isActive && styles.filterCountActive,
                      ]}
                    >
                      {cat.count}
                    </Text>
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {loading && profiles.length === 0 ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#F4F4F5" />
          </View>
        ) : error && profiles.length === 0 ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="No pudimos cargar el directorio"
            description={error}
            actionLabel="Reintentar"
            onAction={() => loadProfiles(false)}
          />
        ) : (
          <FlatList
            data={filteredProfiles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PersonCard profile={item} onPress={handleOpenPerson} />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadProfiles(true)}
                tintColor="#F4F4F5"
              />
            }
            ListEmptyComponent={
              searchQuery.trim().length > 0 || selectedCategoryId ? (
                <EmptyState
                  icon="search-outline"
                  title="Sin coincidencias"
                  description="No encontramos personas con ese filtro o búsqueda."
                  actionLabel="Limpiar filtros"
                  onAction={() => {
                    setSearchQuery("");
                    setSelectedCategoryId(null);
                  }}
                />
              ) : (
                <EmptyState
                  icon="people-outline"
                  title="Aún no hay fichas publicadas"
                  description="Cuando el administrador agregue personas al directorio, aparecerán aquí."
                />
              )
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    gap: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F4F4F5",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: "#A1A1AA",
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
    marginBottom: 12,
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
  categoryScroll: {
    flexGrow: 0,
    marginBottom: 14,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  filterButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "#F4F4F5",
    borderColor: "#F4F4F5",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A1A1AA",
  },
  filterTextActive: {
    color: "#0F1115",
  },
  filterCount: {
    fontVariant: ["tabular-nums"],
    color: "#71717A",
    fontWeight: "500",
  },
  filterCountActive: {
    color: "#52525B",
  },
  loaderBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
});
