import { router } from "expo-router";
import { Button, Copy } from "../../../components/app/ui";
import type { Takeaway } from "../../../db/types";
export function TakeawayEntry({ record }: { record: Takeaway }) {
  return (
    <>
      <Copy>{record.text}</Copy>
      {record.support_id && (
        <Button
          secondary
          label="Open support"
          onPress={() =>
            router.push({
              pathname: "/support/[id]",
              params: { id: record.support_id! },
            })
          }
        />
      )}
    </>
  );
}
