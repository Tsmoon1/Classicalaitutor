"use client";

import { useState, useRef, useEffect } from "react";
import { assignment } from "@/lib/assignment";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: assignment.tutorOpeningMessage },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantContent += parsed.text;
                setMessages([
                  ...newMessages,
                  { role: "assistant", content: assistantContent },
                ]);
              }
            } catch {
              // skip parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    }

    setIsLoading(false);
  }

  async function submitSession() {
    setIsSaving(true);
    try {
      const response = await fetch("/api/save-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert("There was an error saving your session. Please try again.");
      }
    } catch {
      alert("There was an error saving your session. Please try again.");
    }
    setIsSaving(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (isSubmitted) {
    return (
      <div style={styles.container}>
        <div style={styles.submittedCard}>
          <div style={styles.checkmark}>&#10003;</div>
          <h1 style={styles.submittedTitle}>Session Submitted!</h1>
          <p style={styles.submittedText}>
            Great work, {assignment.studentName}! Your tutoring session has been
            saved and your teacher will review your conversation and provide
            feedback.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Classical AI Tutor</h1>
        <p style={styles.headerSubtitle}>
          {assignment.title}
        </p>
      </header>

      {/* Instructions Panel */}
      {showInstructions && (
        <div style={styles.instructionsPanel}>
          <div style={styles.instructionsHeader}>
            <h2 style={styles.instructionsTitle}>Assignment Instructions</h2>
            <button
              onClick={() => setShowInstructions(false)}
              style={styles.closeButton}
            >
              &#10005;
            </button>
          </div>
          <p style={styles.instructionsText}>
            {assignment.instructionsForStudent}
          </p>
        </div>
      )}

      {!showInstructions && (
        <button
          onClick={() => setShowInstructions(true)}
          style={styles.showInstructionsButton}
        >
          Show Assignment Instructions
        </button>
      )}

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.messageBubble,
              ...(msg.role === "user" ? styles.userBubble : styles.tutorBubble),
            }}
          >
            <div style={styles.messageLabel}>
              {msg.role === "user" ? assignment.studentName : "Tutor"}
            </div>
            <div style={styles.messageContent}>{msg.content}</div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div style={{ ...styles.messageBubble, ...styles.tutorBubble }}>
            <div style={styles.messageLabel}>Tutor</div>
            <div style={styles.typing}>Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        <div style={styles.inputRow}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            style={styles.textarea}
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              ...styles.sendButton,
              opacity: isLoading || !input.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </div>
        {messages.length > 2 && (
          <button
            onClick={submitSession}
            disabled={isSaving}
            style={styles.submitButton}
          >
            {isSaving ? "Saving..." : "Submit Session"}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: "0 auto",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    padding: "0 16px",
  },
  header: {
    padding: "20px 0 12px",
    borderBottom: "1px solid #e0ddd5",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  instructionsPanel: {
    background: "#fff",
    border: "1px solid #e0ddd5",
    borderRadius: 8,
    padding: 16,
    margin: "12px 0",
  },
  instructionsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#999",
    padding: "0 4px",
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#444",
    whiteSpace: "pre-line",
  },
  showInstructionsButton: {
    background: "none",
    border: "none",
    color: "#5a67d8",
    fontSize: 13,
    cursor: "pointer",
    padding: "8px 0",
    textAlign: "left" as const,
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "16px 0",
  },
  messageBubble: {
    marginBottom: 16,
    padding: "12px 16px",
    borderRadius: 12,
    maxWidth: "85%",
  },
  userBubble: {
    background: "#e8e5ff",
    marginLeft: "auto",
    borderBottomRightRadius: 4,
  },
  tutorBubble: {
    background: "#fff",
    border: "1px solid #e0ddd5",
    marginRight: "auto",
    borderBottomLeftRadius: 4,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#888",
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
  },
  typing: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  inputArea: {
    borderTop: "1px solid #e0ddd5",
    padding: "12px 0 16px",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #d0cdc5",
    fontSize: 15,
    lineHeight: 1.5,
    resize: "none" as const,
    outline: "none",
    fontFamily: "inherit",
    maxHeight: 150,
  },
  sendButton: {
    padding: "10px 20px",
    background: "#5a67d8",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  submitButton: {
    marginTop: 8,
    width: "100%",
    padding: "12px",
    background: "#2d8a4e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  submittedCard: {
    margin: "auto",
    textAlign: "center" as const,
    padding: 40,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e0ddd5",
    maxWidth: 500,
  },
  checkmark: {
    fontSize: 48,
    color: "#2d8a4e",
    marginBottom: 16,
  },
  submittedTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 12,
  },
  submittedText: {
    fontSize: 16,
    color: "#555",
    lineHeight: 1.6,
  },
};
