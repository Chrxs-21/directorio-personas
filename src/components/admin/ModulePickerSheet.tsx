import { Ionicons } from "@expo/vector-icons";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    CUSTOM_MODULE_DEFINITION,
    MODULE_DEFINITIONS,
} from "../../constants/modules";
import type { ModuleType } from "../../types/profile";

interface ModulePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: ModuleType) => void;
}

export function ModulePickerSheet({
  visible,
  onClose,
  onSelect,
}: ModulePickerSheetProps) {
  function handlePick(type: ModuleType) {
    onSelect(type);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Agregar sección</Text>
              <Text style={styles.subtitle}>
                Elige un campo para añadir a esta ficha
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressedItem,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector"
            >
              <Ionicons name="close" size={20} color="#A1A1AA" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {MODULE_DEFINITIONS.map((item) => (
              <Pressable
                key={item.type}
                onPress={() => handlePick(item.type)}
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.pressedItem,
                ]}
                accessibilityRole="button"
              >
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon} size={20} color="#F4F4F5" />
                </View>

                <Text style={styles.optionLabel}>{item.label}</Text>

                <Ionicons name="add" size={20} color="#71717A" />
              </Pressable>
            ))}

            <View style={styles.divider} />

            <Pressable
              onPress={() => handlePick("custom")}
              style={({ pressed }) => [
                styles.customOptionRow,
                pressed && styles.pressedItem,
              ]}
              accessibilityRole="button"
            >
              <View style={styles.customIconBox}>
                <Ionicons
                  name={CUSTOM_MODULE_DEFINITION.icon}
                  size={20}
                  color="#60A5FA"
                />
              </View>

              <View style={styles.customTextWrap}>
                <Text style={styles.customLabel}>
                  Añadir sección personalizada
                </Text>
                <Text style={styles.customHint}>
                  Crea un apartado con tu propio nombre
                </Text>
              </View>

              <Ionicons name="add-circle-outline" size={22} color="#60A5FA" />
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  sheet: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    maxHeight: "80%",
    backgroundColor: "#181B21",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#272B34",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3F3F46",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F4F4F5",
  },
  subtitle: {
    fontSize: 13,
    color: "#A1A1AA",
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    gap: 8,
    paddingBottom: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    backgroundColor: "#0F1115",
    borderWidth: 1,
    borderColor: "#272B34",
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#181B21",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#F4F4F5",
  },
  divider: {
    height: 1,
    backgroundColor: "#272B34",
    marginVertical: 6,
  },
  customOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 62,
    backgroundColor: "#0F1115",
    borderWidth: 1,
    borderColor: "#1E3A8A",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  customIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#172554",
    alignItems: "center",
    justifyContent: "center",
  },
  customTextWrap: {
    flex: 1,
    gap: 2,
  },
  customLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#93C5FD",
  },
  customHint: {
    fontSize: 12,
    color: "#A1A1AA",
  },
  pressedItem: {
    backgroundColor: "#20242C",
  },
});
