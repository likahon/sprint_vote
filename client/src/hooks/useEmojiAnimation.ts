import { useState, useEffect, useCallback } from "react";
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
      fromUserId: string;
      fromUserName: string;
      toUserId: string;
      id: string;
      fromLeftSide: boolean;
    }) => {
      const targetUserCardRef = userCardRefs.current[data.toUserId];
      
      if (!targetUserCardRef) return;

      const targetRect = targetUserCardRef.getBoundingClientRect();
      const localToPosition = {
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2,
      };

      const screenWidth = window.innerWidth;
      const isLeftSide = data.fromLeftSide;

      const localFromPosition = isLeftSide
        ? { x: -20, y: targetRect.top + targetRect.height / 2 }
        : { x: screenWidth + 20, y: targetRect.top + targetRect.height / 2 };

      const newFlyingEmoji: FlyingEmojiData = {
        id: data.id,
        emoji: data.emoji,
        fromPosition: localFromPosition,
        toPosition: localToPosition,
        targetUserId: data.toUserId,
        fromUserId: data.fromUserId,
        fromLeftSide: isLeftSide,
      };

      setFlyingEmojis((prev) => {
        const alreadyExists = prev.some((e) => e.id === data.id);
        if (alreadyExists) return prev;
        return [...prev, newFlyingEmoji];
      });
    };

    socket.on("emoji-flying", handleEmojiFlying);

    return () => {
      socket.off("emoji-flying", handleEmojiFlying);
    };
  }, [socket, currentUserId, userCardRefs]);

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
    handleFlyingEmojiComplete,
    triggerCardBounce,
  };
};

