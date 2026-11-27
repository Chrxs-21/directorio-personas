import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { getModuleMeta } from "../../constants/modules";
import type { ProfileModule } from "../../types/profile";

interface DynamicModuleInputProps {
  module: ProfileModule;
  onChange: (updated: ProfileModule) => void;
  onRemove: (id: string) => void;
}

export function DynamicModuleInput({
  module,
  onChange,
  onRemove,
}: DynamicModuleInputProps) {
  const meta = getModuleMeta(module);
  const isCustom = module.type === "custom";
  const disableAutoCap =
    module.type === "email" ||
    module.type === "website" ||
    module.type === "instagram";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Ionicons
              name={meta.icon}
              size={18}
              color={isCustom ? "#60A5FA" : "#F4F4F5"}
            />
          </View>
          <Text style={styles.label}>
            {isCustom ? "Sección personalizada" : meta.label}
          </Text>
        </View>

        <Pressable
          onPress={() => onRemove(module.id)}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.removeButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${meta.label}`}
        >
          <Ionicons name="trash-outline" size={18} color="#F87171" />
        </Pressable>
      </View>

      {isCustom ? (
        <TextInput
          value={module.label ?? ""}
          onChangeText={(text) => onChange({ ...module, label: text })}
          placeholder="Nombre del apartado (ej. Horario, TikTok...)"
          placeholderTextColor="#71717A"
          style={styles.input}
        />
      ) : null}

      <TextInput
        value={module.value}
        onChangeText={(text) => onChange({ ...module, value: text })}
        placeholder={meta.placeholder}
        placeholderTextColor="#71717A"
        keyboardType={meta.keyboardType}
        autoCapitalize={disableAutoCap ? "none" : "sentences"}
        autoCorrect={!disableAutoCap}
        multiline={Boolean(meta.multiline)}
        textAlignVertical={meta.multiline ? "top" : "center"}
        style={[styles.input, meta.multiline && styles.multilineInput]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#20242C",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F4F4F5",
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonPressed: {
    backgroundColor: "#2B161B",
  },
  input: {
    minHeight: 46,
    backgroundColor: "#0F1115",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#F4F4F5",
  },
  multilineInput: {
    minHeight: 84,
    paddingTop: 12,
  },
});
