import type Anthropic from '@anthropic-ai/sdk';
import type {
  Tool,
  MessageParam,
  ContentBlock,
  ToolUseBlock,
} from '@anthropic-ai/sdk/resources/messages.js';

export interface AgentLoopOptions {
  client: Anthropic;
  model: string;
  system: string;
  tools: Tool[];
  initialMessages: MessageParam[];
  executeToolCall: (name: string, input: Record<string, unknown>) => Promise<unknown>;
  maxRounds?: number;
  maxTokens?: number;
}

export interface AgentLoopResult {
  output: string;
  rounds: number;
  toolCallCount: number;
}

/**
 * Reusable agentic tool-use loop.
 * Sends messages, handles tool_use stop reason, dispatches tool calls,
 * and loops until end_turn or maxRounds is reached.
 * System prompt is marked for prompt caching to reduce cost on repeated runs.
 */
export async function runAgentLoop({
  client,
  model,
  system,
  tools,
  initialMessages,
  executeToolCall,
  maxRounds = 10,
  maxTokens = 4096,
}: AgentLoopOptions): Promise<AgentLoopResult> {
  const messages: MessageParam[] = [...initialMessages];
  let rounds = 0;
  let toolCallCount = 0;

  while (rounds < maxRounds) {
    rounds++;

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      // Cache the system prompt — stable across runs, saves up to 90% on token cost
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      tools,
      messages,
    });

    if (response.stop_reason === 'end_turn') {
      const output = extractText(response.content);
      return { output, rounds, toolCallCount };
    }

    if (response.stop_reason === 'tool_use') {
      // Append the assistant turn (may contain text + tool_use blocks)
      messages.push({ role: 'assistant', content: response.content });

      const toolUseBlocks = response.content.filter(
        (b): b is ToolUseBlock => b.type === 'tool_use'
      );

      // Execute all tool calls in parallel
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          toolCallCount++;
          try {
            const result = await executeToolCall(
              block.name,
              block.input as Record<string, unknown>
            );
            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: JSON.stringify(result),
            };
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`Tool call failed — ${block.name}:`, message);
            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: `Error executing ${block.name}: ${message}`,
              is_error: true,
            };
          }
        })
      );

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // max_tokens or unexpected stop — return what we have
    const output = extractText(response.content);
    return { output, rounds, toolCallCount };
  }

  return {
    output: `Agent reached max rounds (${maxRounds}) without completing.`,
    rounds,
    toolCallCount,
  };
}

function extractText(content: ContentBlock[]): string {
  return content
    .filter((b): b is Extract<ContentBlock, { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}
