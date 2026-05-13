import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useApp, useInput, useStdin } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ChatTUIProps {
  onSend: (message: string) => Promise<string>;
  sessionId: string;
  model: string;
}

/**
 * 聊天 TUI 组件
 */
export const ChatTUI: React.FC<ChatTUIProps> = ({
  onSend,
  sessionId,
  model,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const messagesEndRef = useRef<Box>(null);
  const { exit } = useApp();

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 添加系统消息
  useEffect(() => {
    setMessages([
      {
        role: "system",
        content: `轻量级 AI 助手已启动\n模型: ${model}\n会话 ID: ${sessionId}\n输入 'help' 查看可用命令`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // 处理键盘输入
  useInput((inputChar, key) => {
    if (key.ctrl && inputChar === "c") {
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
      setInput(newIndex >= 0 ? inputHistory[inputHistory.length - 1 - newIndex] : "");
    }
  });

  // 处理提交
  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    // 添加到输入历史
    setInputHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    // 处理特殊命令
    if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
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
  history          - 显示对话历史
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

    if (trimmed.toLowerCase() === "history") {
      const historyText = messages
        .filter((m) => m.role !== "system")
        .map(
          (m) =>
            `[${m.role === "user" ? "你" : "AI"}] ${m.content.substring(0, 100)}${m.content.length > 100 ? "..." : ""}`
        )
        .join("\n");

      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed, timestamp: new Date() },
        {
          role: "system",
          content: historyText || "对话历史为空",
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
      // 发送消息并获取回复
      const response = await onSend(trimmed);

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: "system",
        content: `错误: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
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
          Author CLI AI 助手
        </Text>
        <Text color="gray">
          模型: {model} | 会话: {sessionId.substring(0, 12)}...
        </Text>
      </Box>

      {/* 消息区域 */}
      <Box flexDirection="column" flexGrow={1} overflowY="auto" padding={1}>
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
          placeholder="输入消息..."
        />
      </Box>
    </Box>
  );
};
