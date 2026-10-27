import { Copy } from "../../../components/app/ui";
import type { Reflection } from "../../../db/types";
export function ReflectionEntry({ record }: { record: Reflection }) {
  return <Copy>{record.text}</Copy>;
}
