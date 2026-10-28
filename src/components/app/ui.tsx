import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette as c } from "../../constants/palette";

const openChairBanner = require("../../../assets/images/OpenChairAppBanner.png");

export function Screen({
  children,
  footer,
}: PropsWithChildren<{ footer?: ReactNode }>) {
  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={s.screen}>
      <KeyboardAvoidingView
        style={s.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={96}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.scrollContent}
        >
          <Image
            source={openChairBanner}
            resizeMode="contain"
            accessibilityLabel="Open Chair. Reflect. Adjust. Grow."
            style={s.brandBanner}
          />
          <View style={s.content}>{children}</View>
        </ScrollView>
        {footer && (
          <View
            style={{
              paddingHorizontal: 22,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderTopColor: c.border,
              backgroundColor: c.background,
            }}
          >
            {footer}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Heading({
  children,
  small = false,
}: PropsWithChildren<{ small?: boolean }>) {
  return (
    <Text accessibilityRole="header" style={small ? s.section : s.heading}>
      {children}
    </Text>
  );
}
export function Copy({
  children,
  muted = false,
}: PropsWithChildren<{ muted?: boolean }>) {
  return <Text style={[s.copy, muted && { color: c.muted }]}>{children}</Text>;
}
export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={s.eyebrow}>{children}</Text>;
}
export function Card({
  children,
  tinted = false,
}: PropsWithChildren<{ tinted?: boolean }>) {
  return (
    <View style={[s.card, tinted && { backgroundColor: c.tint }]}>
      {children}
    </View>
  );
}
export function Row({ children }: PropsWithChildren) {
  return <View style={s.row}>{children}</View>;
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: c.primary }]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Chip({
  label,
  selected = false,
  onPress,
  color = c.primary,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        s.chip,
        {
          borderColor: selected ? color : c.border,
          backgroundColor: selected ? color : c.surface,
        },
      ]}
    >
      <Text
        style={{
          color: selected ? c.onPrimary : c.ink,
          fontSize: 15,
          fontWeight: "500",
        }}
      >
        {selected ? "✓ " : ""}
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 96, textAlignVertical: "top" },
          props.style,
        ]}
      />
      {props.maxLength && (
        <Text style={s.count}>
          {props.value?.length ?? 0} / {props.maxLength}
        </Text>
      )}
    </View>
  );
}
export function ErrorMessage({ message }: { message: string | null }) {
  return message ? (
    <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 16 }}>
      {message}
    </Text>
  ) : null;
}
export function Loading() {
  return (
    <ActivityIndicator
      accessibilityLabel="Loading your local records"
      color={c.primary}
    />
  );
}
export function confirmDelete(
  title: string,
  action: () => void,
  message = "This cannot be undone.",
) {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: action },
  ]);
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  scrollContent: {
    paddingBottom: 36,
  },
  brandBanner: {
    width: 340,
    height: 60,
    maxWidth: "100%",
    alignSelf: "center",
    backgroundColor: c.background,
  },
  content: {
    padding: 22,
    gap: 18,
    maxWidth: 700,
    width: "100%",
    alignSelf: "center",
  },
  heading: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "600",
    letterSpacing: -0.8,
    color: c.ink,
  },
  section: { fontSize: 22, lineHeight: 28, fontWeight: "600", color: c.ink },
  copy: { fontSize: 16, lineHeight: 24, color: c.ink },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "700",
    color: c.primary,
    textTransform: "uppercase",
  },
  card: {
    padding: 20,
    gap: 12,
    backgroundColor: c.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  button: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.primary,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  secondary: { backgroundColor: c.tint },
  buttonText: { fontSize: 16, fontWeight: "600", color: c.onPrimary },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
  },
  label: { color: c.ink, fontSize: 15, fontWeight: "600" },
  input: {
    backgroundColor: c.surface,
    borderRadius: 12,
    borderColor: c.border,
    borderWidth: 1,
    padding: 14,
    fontSize: 16,
    color: c.ink,
    minHeight: 48,
  },
  count: { fontSize: 12, color: c.muted, textAlign: "right" },
});
