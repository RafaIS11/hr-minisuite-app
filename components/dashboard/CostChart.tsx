"use client";

import React from "react";
import { motion } from "framer-motion";

export function CostChart() {
    const data = [12, 18, 15, 22, 28, 25, 32, 38, 35, 42, 45, 42.5];
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const maxValue = Math.max(...data);
    const chartHeight = 300;
    const chartWidth = 700;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * chartWidth;
        const y = chartHeight - (val / maxValue) * chartHeight;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="relative w-full h-[350px] mt-4 overflow-visible px-4">
            <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
            >
                {/* Grid lines */}
                {[0, 1, 2, 3].map((i) => (
                    <line
                        key={i}
                        x1="0"
                        y1={(i * chartHeight) / 3}
                        x2={chartWidth}
                        y2={(i * chartHeight) / 3}
                        stroke="#2C2C2A"
                        strokeOpacity="0.05"
                        strokeWidth="1.5"
                    />
                ))}

                {/* The Line */}
                <motion.polyline
                    fill="none"
                    stroke="#714A38"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={points}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {/* Data points */}
                {data.map((val, i) => {
                    const x = (i / (data.length - 1)) * chartWidth;
                    const y = chartHeight - (val / maxValue) * chartHeight;
                    return (
                        <motion.circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#FFFFFF"
                            stroke="#714A38"
                            strokeWidth="2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.05 }}
                            className="cursor-pointer"
                        >
                            <title>{`${labels[i]}: €${val}k`}</title>
                        </motion.circle>
                    );
                })}
            </svg>

            {/* Labels */}
            <div className="flex justify-between mt-4">
                {labels.map((label) => (
                    <span key={label} className="text-[10px] font-bold text-charcoal/40 uppercase tracking-tighter">
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
}
