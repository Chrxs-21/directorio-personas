import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Profile } from "../../types/profile";

interface PersonCardProps {
  profile: Profile;
  onPress: (profile: Profile) => void;
}

export function PersonCard({ profile, onPress }: PersonCardProps) {
  const categoryText =
    profile.categories.length > 0
      ? profile.categories.map((cat) => cat.name).join(" · ")
      : null;

  return (
    <Pressable
      onPress={() => onPress(profile)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Ver ficha de ${profile.full_name}`}
    >
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {profile.full_name}
        </Text>

        {categoryText ? (
          <Text style={styles.categories} numberOfLines={1}>
            {categoryText}
          </Text>
        ) : (
          <Text style={styles.mutedHint} numberOfLines={1}>
            Sin categoría asignada
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color="#71717A" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  cardPressed: {
    backgroundColor: "#20242C",
    transform: [{ scale: 0.99 }],
  },
  content: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F4F4F5",
    letterSpacing: 0.15,
  },
  categories: {
    fontSize: 13,
    fontWeight: "500",
    color: "#A1A1AA",
  },
  mutedHint: {
    fontSize: 13,
    color: "#71717A",
  },
});
