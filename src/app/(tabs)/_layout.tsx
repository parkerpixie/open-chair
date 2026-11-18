import { Tabs } from "expo-router";
import { Image } from "react-native";
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
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11 },
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
