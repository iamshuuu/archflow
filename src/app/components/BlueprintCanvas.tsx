"use client";

import { useEffect, useRef } from "react";

interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    progress: number;
    speed: number;
    thickness: number;
    opacity: number;
    type: "line" | "arc" | "dimension" | "cross";
    delay: number;
    born: number;
    maxLife: number;
}

function randomBetween(a: number, b: number) {
    return a + Math.random() * (b - a);
}

function createLine(w: number, h: number, now: number): Line {
    const type = (["line", "line", "line", "arc", "dimension", "cross"] as const)[
        Math.floor(Math.random() * 6)
    ];

    // Grid snap for architectural feel
    const gridSize = 60;
    const snapX = () => Math.round(randomBetween(0, w) / gridSize) * gridSize;
    const snapY = () => Math.round(randomBetween(0, h) / gridSize) * gridSize;

    let x1: number, y1: number, x2: number, y2: number;

    if (type === "line") {
        const isHorizontal = Math.random() > 0.4;
        if (isHorizontal) {
            y1 = snapY();
            y2 = y1;
            x1 = snapX();
            x2 = x1 + randomBetween(80, 350);
        } else {
            x1 = snapX();
            x2 = x1;
            y1 = snapY();
            y2 = y1 + randomBetween(80, 350);
        }
    } else if (type === "dimension") {
        // Dimension lines with small perpendicular ticks
        y1 = snapY();
        y2 = y1;
        x1 = snapX();
        x2 = x1 + randomBetween(100, 250);
    } else if (type === "cross") {
        // Small cross mark
        const cx = snapX();
        const cy = snapY();
        x1 = cx - 8;
        y1 = cy - 8;
        x2 = cx + 8;
        y2 = cy + 8;
    } else {
        // Arc reference
        x1 = snapX();
        y1 = snapY();
        x2 = x1 + randomBetween(40, 120);
        y2 = y1 + randomBetween(40, 120);
    }

    return {
        x1, y1, x2, y2,
        progress: 0,
        speed: randomBetween(0.003, 0.012),
        thickness: randomBetween(0.3, 1.2),
        opacity: randomBetween(0.06, 0.18),
        type,
        delay: randomBetween(0, 3000),
        born: now,
        maxLife: randomBetween(8000, 20000),
    };
}

export default function BlueprintCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const linesRef = useRef<Line[]>([]);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let w = window.innerWidth;
        let h = window.innerHeight;

        const resize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w * window.devicePixelRatio;
            canvas.height = h * window.devicePixelRatio;
            canvas.style.width = w + "px";
            canvas.style.height = h + "px";
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        resize();
        window.addEventListener("resize", resize);

        // Initialize lines
        const now = performance.now();
        for (let i = 0; i < 35; i++) {
            linesRef.current.push(createLine(w, h, now - randomBetween(0, 8000)));
        }

        const pencilColor = "140, 130, 115";

        const drawPencilLine = (
            ctx: CanvasRenderingContext2D,
            x1: number, y1: number,
            x2: number, y2: number,
            progress: number,
            thickness: number,
            opacity: number,
        ) => {
            const ex = x1 + (x2 - x1) * progress;
            const ey = y1 + (y2 - y1) * progress;

            ctx.beginPath();
            ctx.moveTo(x1, y1);

            // Slightly wobbly line for pencil sketch effect
            const steps = Math.max(3, Math.floor(Math.sqrt((ex - x1) ** 2 + (ey - y1) ** 2) / 15));
            for (let s = 1; s <= steps; s++) {
                const t = s / steps;
                const px = x1 + (ex - x1) * t + (Math.random() - 0.5) * 0.6;
                const py = y1 + (ey - y1) * t + (Math.random() - 0.5) * 0.6;
                ctx.lineTo(px, py);
            }

            ctx.strokeStyle = `rgba(${pencilColor}, ${opacity})`;
            ctx.lineWidth = thickness;
            ctx.lineCap = "round";
            ctx.stroke();
        };

        const animate = (timestamp: number) => {
            ctx.clearRect(0, 0, w, h);

            linesRef.current.forEach((line) => {
                const age = timestamp - line.born;
                if (age < line.delay) return;

                // Drawing phase
                if (line.progress < 1) {
                    line.progress = Math.min(1, line.progress + line.speed);
                }

                // Fade out at end of life
                const lifeProgress = age / line.maxLife;
                let currentOpacity = line.opacity;
                if (lifeProgress > 0.7) {
                    currentOpacity = line.opacity * (1 - (lifeProgress - 0.7) / 0.3);
                }

                if (currentOpacity <= 0) return;

                if (line.type === "line") {
                    drawPencilLine(ctx, line.x1, line.y1, line.x2, line.y2, line.progress, line.thickness, currentOpacity);
                } else if (line.type === "dimension") {
                    // Dimension line with ticks
                    drawPencilLine(ctx, line.x1, line.y1, line.x2, line.y2, line.progress, line.thickness, currentOpacity);
                    if (line.progress > 0.05) {
                        // Start tick
                        drawPencilLine(ctx, line.x1, line.y1 - 6, line.x1, line.y1 + 6, Math.min(1, line.progress * 5), line.thickness * 0.7, currentOpacity);
                    }
                    if (line.progress > 0.95) {
                        // End tick
                        drawPencilLine(ctx, line.x2, line.y2 - 6, line.x2, line.y2 + 6, Math.min(1, (line.progress - 0.95) * 20), line.thickness * 0.7, currentOpacity);
                    }
                } else if (line.type === "cross") {
                    const cx = (line.x1 + line.x2) / 2;
                    const cy = (line.y1 + line.y2) / 2;
                    drawPencilLine(ctx, cx - 6, cy - 6, cx + 6, cy + 6, line.progress, line.thickness * 0.6, currentOpacity);
                    drawPencilLine(ctx, cx + 6, cy - 6, cx - 6, cy + 6, line.progress, line.thickness * 0.6, currentOpacity);
                } else if (line.type === "arc") {
                    // Small arc
                    const cx = (line.x1 + line.x2) / 2;
                    const cy = (line.y1 + line.y2) / 2;
                    const radius = Math.abs(line.x2 - line.x1) / 2;
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2 * line.progress);
                    ctx.strokeStyle = `rgba(${pencilColor}, ${currentOpacity * 0.7})`;
                    ctx.lineWidth = line.thickness * 0.6;
                    ctx.stroke();
                }
            });

            // Replace dead lines
            linesRef.current = linesRef.current.map((line) => {
                const age = timestamp - line.born;
                if (age > line.maxLife) {
                    return createLine(w, h, timestamp);
                }
                return line;
            });

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(frameRef.current);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                pointerEvents: "none",
            }}
        />
    );
}
