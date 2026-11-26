import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0F1115" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="editor" />
    </Stack>
  );
}
