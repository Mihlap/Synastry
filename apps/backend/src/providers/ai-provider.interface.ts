export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CompleteOptions = {
  model?: string;
  temperature?: number;
};

export interface AIProvider {
  readonly id: string;
  readonly displayName: string;
  listModels(): Promise<string[]>;
  complete(messages: ChatMessage[], options?: CompleteOptions): Promise<string>;
}
