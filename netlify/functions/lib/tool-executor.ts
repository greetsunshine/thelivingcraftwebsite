/**
 * Tool executor — maps tool names to handler functions and dispatches calls.
 * Each agent creates a ToolRegistry with its own tool handlers and passes
 * the registry's execute method to runAgentLoop.
 */

type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

export class ToolRegistry {
  private handlers = new Map<string, ToolHandler>();

  register(name: string, handler: ToolHandler): this {
    this.handlers.set(name, handler);
    return this;
  }

  execute = async (name: string, input: Record<string, unknown>): Promise<unknown> => {
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`Unknown tool: "${name}". Registered tools: ${[...this.handlers.keys()].join(', ')}`);
    }
    return handler(input);
  };
}
