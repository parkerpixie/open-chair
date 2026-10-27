import { Tabs, router } from "expo-router";
import { Pressable, Text } from "react-native";
import { palette as c } from "../../constants/palette";
const routes = [
  { name: "index", title: "Today", icon: "◉" },
  { name: "check-in", title: "Check In", icon: "+" },
  { name: "my-days", title: "My Days", icon: "▦" },
  { name: "tools", title: "Tools", icon: "◇" },
  { name: "supports", title: "Supports", icon: "◎" },
];
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitle: "Open Chair",
        headerTitleStyle: { fontSize: 20, fontWeight: "600", letterSpacing: 1 },
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.ink,
        headerShadowVisible: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        tabBarLabelStyle: { fontSize: 11 },
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => router.push("/settings")}
            style={{
              minWidth: 48,
              minHeight: 44,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 10,
            }}
          >
            <Text style={{ fontSize: 25, color: c.ink }}>⚙</Text>
          </Pressable>
        ),
      }}
    >
      {routes.map((route) => (
        <Tabs.Screen
          key={route.name}
          name={route.name}
          options={{
            title: route.title,
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 26, color }}>{route.icon}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
