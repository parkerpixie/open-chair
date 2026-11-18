import { useState } from "react";
import { router } from "expo-router";
import {
  Button,
  Card,
  Copy,
  Eyebrow,
  Field,
  Heading,
  Screen,
} from "../../components/app/ui";
import { tools } from "../../features/tools/catalog";
import { Breathing } from "../../features/tools/Breathing";
export default function ToolsScreen() {
  const [query, setQuery] = useState("");
  const matching = tools.filter((tool) =>
    `${tool.title} ${tool.when} ${tool.category}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <Screen>
      <Eyebrow>Small ways to make room</Eyebrow>
      <Heading>Tools, when useful.</Heading>
      <Copy muted>
        You don’t have to change a feeling to understand it. These optional
        practices draw on DBT and everyday reflection.
      </Copy>
      <Breathing />
      <Field
        label="Find a tool"
        value={query}
        onChangeText={setQuery}
        placeholder="Search skills or situations"
      />
      {!matching.length && <Copy>No tools match that search.</Copy>}
      {[...new Set(matching.map((t) => t.category))].map((category) => (
        <Card key={category}>
          <Eyebrow>{category}</Eyebrow>
          {matching
            .filter((t) => t.category === category)
            .map((tool) => (
              <Card key={tool.id}>
                <Heading small>{tool.title}</Heading>
                <Copy muted>{tool.when}</Copy>
                <Button
                  secondary
                  label={`Explore ${tool.title}`}
                  onPress={() =>
                    router.push({
                      pathname: "/tool/[id]",
                      params: { id: tool.id },
                    })
                  }
                />
              </Card>
            ))}
        </Card>
      ))}
    </Screen>
  );
}
