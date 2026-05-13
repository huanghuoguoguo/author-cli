import React from "react";
import { render } from "ink";
import { ChatTUI } from "./ChatTUI.js";
import { LightweightAI } from "../commands/ai.js";

interface StartTUIOptions {
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
  sessionId?: string;
}

/**
 * 启动 TUI 界面
 */
export function startTUI(options: StartTUIOptions = {}): void {
  // 创建 AI 实例
  const ai = new LightweightAI({
    model: options.model,
    maxTokens: options.maxTokens,
    systemPrompt: options.systemPrompt,
    sessionId: options.sessionId,
  });

  // 渲染 TUI
  const { waitUntilExit } = render(
    <ChatTUI
      onSend={(message) => ai.chat(message)}
      sessionId={ai.getSessionId()}
      model={options.model || "claude-3-5-sonnet-latest"}
    />
  );

  waitUntilExit().then(() => {
    // 保存会话
    ai.saveSession();
    process.exit(0);
  });
}
