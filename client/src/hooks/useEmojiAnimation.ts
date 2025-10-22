import { useState, useEffect, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { FlyingEmojiData, ANIMATION_CONFIG } from "../types";

interface UseEmojiAnimationProps {
  socket: Socket | null;
  currentUserId: string;
  userCardRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
}

export const useEmojiAnimation = ({
  socket,
  currentUserId,
  userCardRefs,
}: UseEmojiAnimationProps) => {
  const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmojiData[]>([]);
  const [bouncingCard, setBouncingCard] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleEmojiFlying = (data: {
      emoji: string;
      fromPosition: { x: number; y: number };
      toPosition: { x: number; y: number };
      fromUserId: string;
      fromUserName: string;
      toUserId: string;
      id: string;
    }) => {
      if (data.fromUserId !== currentUserId) {
        const targetUserCardRef = userCardRefs.current[data.toUserId];
        let localToPosition = data.toPosition;

        if (targetUserCardRef) {
          const rect = targetUserCardRef.getBoundingClientRect();
          localToPosition = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
        }

        const newFlyingEmoji: FlyingEmojiData = {
          id: data.id,
          emoji: data.emoji,
          fromPosition: data.fromPosition,
          toPosition: localToPosition,
          targetUserId: data.toUserId,
          fromUserId: data.fromUserId,
        };

        setFlyingEmojis((prev) => {
          const alreadyExists = prev.some((e) => e.id === data.id);
          if (alreadyExists) return prev;
          return [...prev, newFlyingEmoji];
        });
      }
    };

    socket.on("emoji-flying", handleEmojiFlying);

    return () => {
      socket.off("emoji-flying", handleEmojiFlying);
    };
  }, [socket, currentUserId, userCardRefs]);

  const addFlyingEmoji = useCallback((emoji: FlyingEmojiData) => {
    setFlyingEmojis((prev) => [...prev, emoji]);
  }, []);

  const handleFlyingEmojiComplete = useCallback((emojiId: string) => {
    setFlyingEmojis((prev) => prev.filter((emoji) => emoji.id !== emojiId));
  }, []);

  const triggerCardBounce = useCallback((userId: string) => {
    setBouncingCard(userId);
    setTimeout(() => {
      setBouncingCard(null);
    }, ANIMATION_CONFIG.CARD_BOUNCE_DURATION);
  }, []);

  return {
    flyingEmojis,
    bouncingCard,
    addFlyingEmoji,
    handleFlyingEmojiComplete,
    triggerCardBounce,
  };
};

