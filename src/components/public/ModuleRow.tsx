import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { buildModuleActionUrl, getModuleMeta } from "../../constants/modules";
import type { ProfileModule } from "../../types/profile";

interface ModuleRowProps {
  module: ProfileModule;
}

export function ModuleRow({ module }: ModuleRowProps) {
  const meta = getModuleMeta(module);
  const actionUrl = buildModuleActionUrl(module.type, module.value);
  const isClickable = Boolean(actionUrl);

  async function handlePress() {
    if (!actionUrl) return;
    try {
      await Linking.openURL(actionUrl);
    } catch {
      // Si el navegador o dispositivo no soporta el esquema, no rompe la app
    }
  }

  const content = (
    <>
      <View style={styles.iconWrap}>
        <Ionicons name={meta.icon} size={20} color="#F4F4F5" />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.label}>{meta.label}</Text>
        <Text style={styles.value} selectable>
          {module.value}
        </Text>
      </View>

      {isClickable ? (
        <Ionicons name="open-outline" size={18} color="#60A5FA" />
      ) : null}
    </>
  );

  if (isClickable) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        accessibilityRole="link"
        accessibilityLabel={`${meta.label}: ${module.value}`}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    backgroundColor: "#181B21",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rowPressed: {
    backgroundColor: "#20242C",
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#20242C",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#A1A1AA",
  },
  value: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
    color: "#F4F4F5",
  },
});
