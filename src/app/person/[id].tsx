import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ModuleRow } from "../../components/public/ModuleRow";
import { EmptyState } from "../../components/ui/EmptyState";
import { fetchProfileById } from "../../services/profiles.service";
import type { Profile } from "../../types/profile";

export default function PersonDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const personId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPerson = useCallback(async () => {
    if (!personId) {
      setLoading(false);
      setError("Identificador de ficha inválido.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchProfileById(personId);
      setProfile(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al cargar.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    loadPerson();
  }, [loadPerson]);

  function handleGoBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.wrapper}>
        <View style={styles.topBar}>
          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Volver al directorio"
          >
            <Ionicons name="arrow-back" size={20} color="#F4F4F5" />
            <Text style={styles.backText}>Directorio</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#F4F4F5" />
          </View>
        ) : error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="No pudimos cargar la ficha"
            description={error}
            actionLabel="Reintentar"
            onAction={loadPerson}
          />
        ) : !profile ? (
          <EmptyState
            icon="person-outline"
            title="Ficha no encontrada"
            description="Es posible que esta persona ya no esté publicada en el directorio."
            actionLabel="Volver al directorio"
            onAction={handleGoBack}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.profileHeader}>
              <Text style={styles.name}>{profile.full_name}</Text>

              {profile.categories.length > 0 ? (
                <Text style={styles.categories}>
                  {profile.categories.map((cat) => cat.name).join(" · ")}
                </Text>
              ) : null}
            </View>

            <View style={styles.divider} />

            {profile.modules.length > 0 ? (
              <View style={styles.modulesList}>
                {profile.modules.map((mod) => (
                  <ModuleRow key={mod.id} module={mod} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="document-text-outline"
                title="Sin información adicional"
                description="Esta ficha todavía no tiene secciones agregadas."
              />
            )}
          </ScrollView>
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
  topBar: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  backButton: {
    minHeight: 44,
    paddingHorizontal: 10,
    marginLeft: -10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButtonPressed: {
    backgroundColor: "#181B21",
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F4F4F5",
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  profileHeader: {
    gap: 6,
    paddingBottom: 18,
  },
  name: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: "#F4F4F5",
    letterSpacing: -0.4,
  },
  categories: {
    fontSize: 14,
    fontWeight: "500",
    color: "#A1A1AA",
  },
  divider: {
    height: 1,
    backgroundColor: "#272B34",
    marginBottom: 18,
  },
  modulesList: {
    gap: 10,
  },
});
