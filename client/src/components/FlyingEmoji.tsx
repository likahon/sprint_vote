import React, { useEffect, useState, useRef } from "react";
import { ANIMATION_CONFIG } from "../types";
import cloudvalleyLogo from "../assets/CV-Celeste.png";

interface FlyingEmojiProps {
  emoji: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  onComplete: () => void;
  onImpact?: () => void;
}

export const FlyingEmoji: React.FC<FlyingEmojiProps> = ({
  emoji,
  fromPosition,
  toPosition,
  onComplete,
  onImpact,
}) => {
  const [position, setPosition] = useState({
    x: fromPosition.x,
    y: fromPosition.y,
    scale: 0.5,
    rotation: 0,
  });
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = ANIMATION_CONFIG.EMOJI_FLIGHT_DURATION;
    const startTime = Date.now();

    const distance = Math.sqrt(
      Math.pow(toPosition.x - fromPosition.x, 2) +
        Math.pow(toPosition.y - fromPosition.y, 2)
    );
    const flightTime = duration * 0.15;
    const initialSpeed = (distance / flightTime) * 8;

    const angle = Math.atan2(
      toPosition.y - fromPosition.y,
      toPosition.x - fromPosition.x
    );

    let velocityX = Math.cos(angle) * initialSpeed;
    let velocityY = Math.sin(angle) * initialSpeed;

    const gravity = 0.2;
    const bounceDamping = 0.7;
    const friction = 0.95;

    let currentX = fromPosition.x;
    let currentY = fromPosition.y;
    let hasHit = false;
    let bounceCount = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < duration) {
        if (hasHit) {
          velocityY += gravity;
          velocityX *= friction;
        }

        currentX += velocityX;
        currentY += velocityY;

        const distanceToTarget = Math.sqrt(
          Math.pow(currentX - toPosition.x, 2) +
            Math.pow(currentY - toPosition.y, 2)
        );

        if (distanceToTarget < 30 && !hasHit) {
          hasHit = true;
          bounceCount++;

          if (onImpact) {
            onImpact();
          }

          const impactAngle = Math.atan2(
            toPosition.y - currentY,
            toPosition.x - currentX
          );

          const currentSpeed = Math.sqrt(
            velocityX * velocityX + velocityY * velocityY
          );

          const bounceSpeed = currentSpeed * bounceDamping;
          const randomFactor = 0.8 + Math.random() * 0.4;
          velocityX = -Math.cos(impactAngle) * bounceSpeed * randomFactor;
          velocityY = -Math.sin(impactAngle) * bounceSpeed * randomFactor;

          const offsetX = Math.cos(impactAngle) * 25;
          const offsetY = Math.sin(impactAngle) * 25;
          currentX = toPosition.x + offsetX;
          currentY = toPosition.y + offsetY;
        }

        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        const baseScale = hasHit ? 0.7 : 1.2;
        const speedScale = Math.min(0.4, speed * 0.03);
        const scale = baseScale + speedScale;
        const rotation = (elapsed * 1.2) % 360;

        const fadeInTime = 200;
        const currentOpacity = Math.min(1, elapsed / fadeInTime);

        setPosition({
          x: currentX,
          y: currentY,
          scale,
          rotation,
        });

        setOpacity(currentOpacity);

        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsVisible(false);
        setTimeout(() => onComplete(), 200);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [emoji, fromPosition.x, fromPosition.y, toPosition.x, toPosition.y]);

  if (!isVisible) return null;

  const isCustomEmoji = emoji === "cloudvalley";

  return (
    <div
      className="flying-emoji"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        transform: `translate(-50%, -50%) scale(${position.scale}) rotate(${position.rotation}deg)`,
        zIndex: 2000,
        pointerEvents: "none",
        fontSize: isCustomEmoji ? undefined : "24px",
        textShadow: isCustomEmoji ? undefined : "0 0 10px rgba(0,0,0,0.5)",
        opacity: opacity,
        transition: "none",
      }}
    >
      {isCustomEmoji ? (
        <img
          src={cloudvalleyLogo}
          alt="Cloudvalley"
          style={{
            width: "24px",
            height: "24px",
            objectFit: "contain",
            filter: "drop-shadow(0 0 10px rgba(0,0,0,0.5))",
          }}
        />
      ) : (
        emoji
      )}
    </div>
  );
};
