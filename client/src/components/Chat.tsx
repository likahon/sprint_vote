import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";

interface ChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  onSendMessage: (message: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  isOpen,
  onToggle,
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = inputMessage.trim();

    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setInputMessage("");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`chat-container ${isOpen ? "open" : "closed"}`}>
      <button className="chat-toggle" onClick={onToggle}>
        <span className="chat-icon">💬</span>
        {!isOpen && messages.length > 0 && (
          <span className="chat-badge">{messages.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <h3>Chat</h3>
            <button className="chat-close" onClick={onToggle}>
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <p>No hay mensajes aún.</p>
                <p className="chat-empty-hint">
                  ¡Sé el primero en enviar un mensaje!
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${
                    msg.userId === currentUserId
                      ? "own-message"
                      : "other-message"
                  }`}
                >
                  <div className="message-header">
                    <span className="message-author">
                      {msg.userId === currentUserId ? "Tú" : msg.userName}
                    </span>
                    <span className="message-time">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="message-content">{msg.message}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Escribe un mensaje..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              maxLength={500}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputMessage.trim()}
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
