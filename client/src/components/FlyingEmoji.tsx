import React, { useEffect, useState, useRef } from "react";

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
    scale: 0.5, // Empezar más pequeño
    rotation: 0,
  });
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(0); // Empezar invisible
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("FlyingEmoji mounted with:", {
      emoji,
      fromPosition,
      toPosition,
    });
    const duration = 1500; // Duración total de la animación en ms
    const startTime = Date.now();

    // Física del emoji como proyectil
    const distance = Math.sqrt(
      Math.pow(toPosition.x - fromPosition.x, 2) +
        Math.pow(toPosition.y - fromPosition.y, 2)
    );
    const flightTime = duration * 0.15; // Tiempo muy corto para llegar al objetivo
    const initialSpeed = (distance / flightTime) * 8; // Velocidad octuplicada

    console.log("Animation setup:", {
      distance,
      flightTime,
      initialSpeed,
      fromPosition,
      toPosition,
      angle: Math.atan2(
        toPosition.y - fromPosition.y,
        toPosition.x - fromPosition.x
      ),
      velocityX:
        Math.cos(
          Math.atan2(
            toPosition.y - fromPosition.y,
            toPosition.x - fromPosition.x
          )
        ) * initialSpeed,
      velocityY:
        Math.sin(
          Math.atan2(
            toPosition.y - fromPosition.y,
            toPosition.x - fromPosition.x
          )
        ) * initialSpeed,
    });

    // Calcular ángulo inicial hacia el objetivo
    const angle = Math.atan2(
      toPosition.y - fromPosition.y,
      toPosition.x - fromPosition.x
    );

    let velocityX = Math.cos(angle) * initialSpeed;
    let velocityY = Math.sin(angle) * initialSpeed; // Movimiento directo al objetivo

    // Física realista para proyectil con rebote
    const gravity = 0.2; // Gravedad más fuerte para caída realista
    const bounceDamping = 0.7; // Factor de amortiguación del rebote
    const friction = 0.95; // Fricción para que se detenga gradualmente

    let currentX = fromPosition.x;
    let currentY = fromPosition.y;
    let hasHit = false;
    let bounceCount = 0;
    // const maxBounces = 3;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      // const deltaTime = 16; // Aproximadamente 60fps

      if (elapsed < duration) {
        // Solo log cada 100ms para no saturar la consola
        if (elapsed % 100 < 16) {
          console.log("Animating - elapsed:", elapsed, "position:", {
            x: currentX,
            y: currentY,
          });
        }

        // Aplicar gravedad solo después del primer impacto
        if (hasHit) {
          velocityY += gravity;
          // Aplicar fricción solo después del impacto
          velocityX *= friction;
        }

        // Actualizar posición
        currentX += velocityX;
        currentY += velocityY;

        // Verificar si ha llegado al objetivo
        const distanceToTarget = Math.sqrt(
          Math.pow(currentX - toPosition.x, 2) +
            Math.pow(currentY - toPosition.y, 2)
        );

        if (distanceToTarget < 30 && !hasHit) {
          console.log("IMPACT DETECTED!", {
            distanceToTarget,
            currentPosition: { x: currentX, y: currentY },
            targetPosition: { x: toPosition.x, y: toPosition.y },
            velocity: { x: velocityX, y: velocityY },
          });
          hasHit = true;
          bounceCount++;

          // Notificar el impacto
          if (onImpact) {
            onImpact();
          }

          // Calcular ángulo de rebote (opuesto al ángulo de llegada)
          const impactAngle = Math.atan2(
            toPosition.y - currentY,
            toPosition.x - currentX
          );

          // Calcular velocidad actual
          const currentSpeed = Math.sqrt(
            velocityX * velocityX + velocityY * velocityY
          );

          // Rebote con física realista - mantener más velocidad
          const bounceSpeed = currentSpeed * bounceDamping;
          // Añadir un poco de variación aleatoria al rebote
          const randomFactor = 0.8 + Math.random() * 0.4; // Entre 0.8 y 1.2
          velocityX = -Math.cos(impactAngle) * bounceSpeed * randomFactor;
          velocityY = -Math.sin(impactAngle) * bounceSpeed * randomFactor;

          // Ajustar posición para evitar que se quede dentro del objetivo
          const offsetX = Math.cos(impactAngle) * 25;
          const offsetY = Math.sin(impactAngle) * 25;
          currentX = toPosition.x + offsetX;
          currentY = toPosition.y + offsetY;

          console.log("BOUNCE!", {
            newVelocity: { x: velocityX, y: velocityY },
            bounceSpeed,
            impactAngle,
          });
        }

        // Calcular escala y rotación basados en velocidad
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        const baseScale = hasHit ? 0.7 : 1.2; // Más grande antes del impacto, más pequeño después
        const speedScale = Math.min(0.4, speed * 0.03);
        const scale = baseScale + speedScale;
        const rotation = (elapsed * 1.2) % 360; // Rotación más rápida

        // Calcular opacidad (aparece gradualmente al inicio)
        const fadeInTime = 200; // Tiempo para aparecer completamente
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
        // Animación completada
        console.log(
          "Animation completed - elapsed:",
          elapsed,
          "duration:",
          duration
        );
        setIsVisible(false);
        setTimeout(() => onComplete(), 200);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [emoji, fromPosition.x, fromPosition.y, toPosition.x, toPosition.y]);

  if (!isVisible) return null;

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
        fontSize: "24px",
        textShadow: "0 0 10px rgba(0,0,0,0.5)",
        opacity: opacity,
        transition: "none", // Desactivar transiciones CSS para control total
      }}
    >
      {emoji}
    </div>
  );
};
