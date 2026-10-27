import { router } from "expo-router";
import { Button, Copy } from "../../../components/app/ui";
import type { ToolSession } from "../../../db/types";
import { toolById } from "../../tools/catalog";
import { toolResponses } from "../timeline";
export function ToolEntry({ record }: { record: ToolSession }) {
  const tool = toolById(record.tool_id);
  const responses = toolResponses(record.responses);
  return (
    <>
      <Copy>{tool?.title ?? record.tool_id}</Copy>
      {responses ? (
        responses.map((response, index) => <Copy key={index}>{response}</Copy>)
      ) : (
        <Copy muted>The saved responses could not be displayed.</Copy>
      )}
      {tool && (
        <Button
          secondary
          label={`Open ${tool.title} tool`}
          onPress={() =>
            router.push({ pathname: "/tool/[id]", params: { id: tool.id } })
          }
        />
      )}
    </>
  );
}
