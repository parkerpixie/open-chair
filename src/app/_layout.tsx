import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DatabaseProvider } from "../db/provider";
import { palette } from "../constants/palette";

const headerBanner = require("../../assets/images/OpenChairAppBanner.png");

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: palette.background },
            headerTintColor: palette.ink,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: palette.background },
            headerBackButtonDisplayMode: "minimal",
            headerTitleAlign: "center",
            headerTitle: () => (
              <Image
                source={headerBanner}
                resizeMode="contain"
                style={{ width: 240, height: 48 }}
              />
            ),
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="patterns" options={{ title: "Patterns" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
          <Stack.Screen
            name="tool/[id]"
            options={{ title: "A little room to try" }}
          />
          <Stack.Screen
            name="support/new"
            options={{ title: "Add a support" }}
          />
          <Stack.Screen
            name="support/[id]"
            options={{ title: "Your support" }}
          />
        </Stack>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
