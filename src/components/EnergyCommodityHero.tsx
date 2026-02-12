import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getCommodityTheme, type CommodityTheme } from "@/data/commodityThemes";

interface EnergyCommodityHeroProps {
  commodityName: string;
  theme?: CommodityTheme;
}

function HeroParticles({
  color,
  count = 50,
}: {
  color: [number, number, number];
  count?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [r, g, b] = color;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: {
      x: number;
      y: number;
      r: number;
      speed: number;
      opacity: number;
      pulse: number;
    }[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * (canvas.width || 400),
        y: Math.random() * (canvas.height || 200),
        r: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.25 + 0.03,
        opacity: Math.random() * 0.4 + 0.1,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) {
        animId = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.pulse += 0.02;
        if (p.y < -5) {
          p.y = h + 5;
          p.x = Math.random() * w;
        }
        const flicker = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${flicker})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, [r, g, b, count]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  );
}

export function EnergyCommodityHero({ commodityName, theme: themeProp }: EnergyCommodityHeroProps) {
  const theme = themeProp ?? getCommodityTheme(commodityName);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-xl overflow-hidden border border-border/50 shadow-lg"
      style={{
        background: theme.gradient,
      }}
    >
      {/* Animated gradient overlay for subtle shift */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${theme.accent} 0%, transparent 70%)`,
          animation: "heroShine 8s ease-in-out infinite alternate",
        }}
      />
      <HeroParticles color={theme.particleColor} count={45} />
      <div className="relative z-10 px-6 py-12 sm:px-8 sm:py-16">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground"
          style={{
            textShadow: "0 0 40px rgba(0,0,0,0.3)",
          }}
        >
          {commodityName}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-sm sm:text-base text-muted-foreground"
        >
          Production, consumption, and outlook
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-4 h-0.5 w-24 origin-left rounded-full"
          style={{ backgroundColor: theme.accent }}
        />
      </div>
      <style>{`
        @keyframes heroShine {
          from { opacity: 0.2; }
          to { opacity: 0.35; }
        }
      `}</style>
    </motion.section>
  );
}
