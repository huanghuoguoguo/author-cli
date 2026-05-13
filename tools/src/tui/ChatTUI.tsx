import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { PiAgentWrapper } from "../commands/ai-pi.js";
import type { AgentSessionEvent } from "@earendil-works/pi-coding-agent";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ChatTUIProps {
  model?: string;
  sessionId?: string;
}

/**
 * 聊天 TUI 组件（基于 Pi Agent）
 */
export const ChatTUI: React.FC<ChatTUIProps> = ({
  model = "claude-sonnet-4-20250514",
  sessionId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const agentRef = useRef<PiAgentWrapper | null>(null);
  const messagesEndRef = useRef<Box>(null);
  const { exit } = useApp();

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化 Agent
  useEffect(() => {
    const initAgent = async () => {
      const agent = new PiAgentWrapper({
        model,
        sessionId,
      });

      // 监听事件
      agent.onEvent((event: AgentSessionEvent) => {
        handleAgentEvent(event);
      });

      try {
        await agent.initialize();
        agentRef.current = agent;
        setIsInitialized(true);

        setMessages([
          {
            role: "system",
            content: `AI 助手已启动\n模型: ${model}\n会话 ID: ${agent.getSessionId()}\n输入 'help' 查看可用命令`,
            timestamp: new Date(),
          },
        ]);
      } catch (error: any) {
        setMessages([
          {
            role: "system",
            content: `初始化失败: ${error.message}`,
            timestamp: new Date(),
          },
        ]);
      }
    };

    initAgent();

    return () => {
      if (agentRef.current) {
        agentRef.current.dispose();
      }
    };
  }, []);

  // 处理 Agent 事件
  const handleAgentEvent = (event: AgentSessionEvent) => {
    switch (event.type) {
      case "message_end":
        if (event.message?.role === "assistant") {
          const content =
            event.message.content
              ?.filter((c: any) => c.type === "text")
              .map((c: any) => c.text)
              .join("") || "";

          if (content) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content,
                timestamp: new Date(),
              },
            ]);
          }
        }
        setIsLoading(false);
        break;

      case "tool_call":
        // 可以在这里显示工具调用状态
        break;

      case "error":
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `错误: ${event.error}`,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        break;
    }
  };

  // 处理键盘输入
  useInput((inputChar, key) => {
    if (key.ctrl && inputChar === "c") {
      if (agentRef.current) {
        agentRef.current.dispose();
      }
      exit();
    }

    // 历史上翻
    if (key.upArrow && inputHistory.length > 0) {
      const newIndex =
        historyIndex < inputHistory.length - 1
          ? historyIndex + 1
          : historyIndex;
      setHistoryIndex(newIndex);
      setInput(inputHistory[inputHistory.length - 1 - newIndex] || "");
    }

    // 历史下翻
    if (key.downArrow) {
      const newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
      setHistoryIndex(newIndex);
      setInput(
        newIndex >= 0 ? inputHistory[inputHistory.length - 1 - newIndex] : ""
      );
    }
  });

  // 处理提交
  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || !isInitialized) return;

    // 添加到输入历史
    setInputHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    // 处理特殊命令
    if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
      if (agentRef.current) {
        agentRef.current.dispose();
      }
      exit();
      return;
    }

    if (trimmed.toLowerCase() === "clear") {
      setMessages([]);
      setInput("");
      return;
    }

    if (trimmed.toLowerCase() === "help") {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed, timestamp: new Date() },
        {
          role: "system",
          content: `可用命令:
  help, h          - 显示帮助信息
  clear            - 清空对话历史
  exit, quit       - 退出程序

快捷键:
  Ctrl+C           - 强制退出
  ↑/↓              - 浏览输入历史`,
          timestamp: new Date(),
        },
      ]);
      setInput("");
      return;
    }

    // 添加用户消息
    const userMessage: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 发送消息
      await agentRef.current?.prompt(trimmed);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `错误: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 获取消息颜色
  const getMessageColor = (role: string) => {
    switch (role) {
      case "user":
        return "cyan";
      case "assistant":
        return "green";
      case "system":
        return "yellow";
      default:
        return "white";
    }
  };

  // 获取消息前缀
  const getMessagePrefix = (role: string) => {
    switch (role) {
      case "user":
        return "你";
      case "assistant":
        return "AI";
      case "system":
        return "系统";
      default:
        return "";
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* 状态栏 */}
      <Box
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        justifyContent="space-between"
      >
        <Text color="blue" bold>
          Author CLI AI 助手 (Pi Agent)
        </Text>
        <Text color="gray">
          模型: {model} | 状态: {isInitialized ? "就绪" : "初始化中..."}
        </Text>
      </Box>

      {/* 消息区域 */}
      <Box flexDirection="column" flexGrow={1} overflowY="hidden" padding={1}>
        {messages.map((msg, index) => (
          <Box key={index} flexDirection="column" marginBottom={1}>
            <Box>
              <Text color={getMessageColor(msg.role)} bold>
                [{getMessagePrefix(msg.role)}]
              </Text>
              <Text color="gray"> {formatTime(msg.timestamp)}</Text>
            </Box>
            <Box paddingLeft={2}>
              <Text color={getMessageColor(msg.role)} wrap="wrap">
                {msg.content}
              </Text>
            </Box>
          </Box>
        ))}

        {isLoading && (
          <Box paddingLeft={2}>
            <Text color="green">
              <Spinner type="dots" /> AI 正在思考...
            </Text>
          </Box>
        )}

        <Box ref={messagesEndRef} />
      </Box>

      {/* 输入区域 */}
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="cyan" bold>
          你:{" "}
        </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={isInitialized ? "输入消息..." : "初始化中..."}
        />
      </Box>
    </Box>
  );
};
