import { DurableObject } from "cloudflare:workers";

interface Env {
  AI: Ai;
  KnowledgeAgent: DurableObjectNamespace;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface IncomingMessage {
  type: string;
  content?: string;
}


const SYSTEM_PROMPT = `You are KnowledgeMate, a friendly and helpful AI knowledge assistant. You help users with questions, brainstorming, explanations, and general conversation.

Your key traits:
- You give clear, concise answers
- You can help with coding, writing, research, and creative tasks
- You remember the full conversation context
- When you don't know something, you say so honestly
- You format responses with markdown when helpful (lists, code blocks, bold, etc.)

Keep responses focused and useful. Avoid unnecessary filler.`;

// ── KnowledgeAgent Durable Object ──────────────────────────────────────

export class KnowledgeAgent extends DurableObject<Env> {
  private conversationHistory: ChatMessage[] = [];

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.ctx.acceptWebSocket(server);

      const stored = await this.ctx.storage.get<ChatMessage[]>("history");
      if (stored) {
        this.conversationHistory = stored;
      }

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Expected WebSocket", { status: 400 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;

    let parsed: IncomingMessage;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    if (parsed.type === "chat" && parsed.content) {
      await this.handleChat(ws, parsed.content);
    } else if (parsed.type === "clear") {
      this.conversationHistory = [];
      await this.ctx.storage.put("history", []);
      ws.send(JSON.stringify({ type: "cleared" }));
    }
  }

  async webSocketClose(ws: WebSocket) {
    await this.ctx.storage.put("history", this.conversationHistory);
  }

  async handleChat(ws: WebSocket, userMessage: string) {
    this.conversationHistory.push({ role: "user", content: userMessage });

    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...this.conversationHistory,
    ];

    ws.send(JSON.stringify({ type: "start" }));

    try {
      const stream = await this.env.AI.run(
        "@cf/meta/llama-3.1-8b-instruct-fp8",
        {
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
          max_tokens: 2048,
        }
      );

      let fullResponse = "";

      const reader = (stream as ReadableStream).getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const token = parsed.response || "";
              if (token) {
                fullResponse += token;
                ws.send(JSON.stringify({ type: "token", content: token }));
              }
            } catch {
            }
          }
        }
      }

      this.conversationHistory.push({
        role: "assistant",
        content: fullResponse,
      });

      await this.ctx.storage.put("history", this.conversationHistory);

      ws.send(JSON.stringify({ type: "done" }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      ws.send(JSON.stringify({ type: "error", content: errorMessage }));
    }
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    const match = url.pathname.match(/^\/agents\/KnowledgeAgent\/(.+)$/);
    if (match) {
      const id = env.KnowledgeAgent.idFromName(match[1]);
      const stub = env.KnowledgeAgent.get(id);
      return stub.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
