import React from "react";
import { render } from "ink";
import { ChatTUI } from "./ChatTUI.js";

interface StartTUIOptions {
  model?: string;
  sessionId?: string;
}

/**
 * 启动 TUI 界面
 */
export function startTUI(options: StartTUIOptions = {}): void {
  const { waitUntilExit } = render(
    <ChatTUI
      model={options.model || "claude-sonnet-4-20250514"}
      sessionId={options.sessionId}
    />
  );

  waitUntilExit().then(() => {
    process.exit(0);
  });
}
