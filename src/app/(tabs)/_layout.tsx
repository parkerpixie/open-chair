import { Tabs, router } from "expo-router";
import { Image, Pressable, Text } from "react-native";
import { palette as c } from "../../constants/palette";

const routes = [
  {
    name: "index",
    title: "Today",
    icon: require("../../../assets/images/open-chair-nav-today.png"),
  },
  {
    name: "check-in",
    title: "Check In",
    icon: require("../../../assets/images/open-chair-nav-check-in.png"),
  },
  {
    name: "my-days",
    title: "My Days",
    icon: require("../../../assets/images/open-chair-nav-my-days.png"),
  },
  {
    name: "tools",
    title: "Tools",
    icon: require("../../../assets/images/open-chair-nav-tools.png"),
  },
  {
    name: "supports",
    title: "Supports",
    icon: require("../../../assets/images/open-chair-nav-supports.png"),
  },
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
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          paddingTop: 4,
        },
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
            tabBarIcon: ({ focused }) => (
              <Image
                source={route.icon}
                resizeMode="contain"
                style={{
                  width: 32,
                  height: 32,
                  opacity: focused ? 1 : 0.58,
                }}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
