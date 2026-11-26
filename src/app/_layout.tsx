import { Stack } from "expo-router";
import { StatusBar } from "react-native";

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F1115" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="person/[id]" />
        <Stack.Screen name="admin" />
      </Stack>
    </>
  );
}
