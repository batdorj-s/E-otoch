import { motion } from "motion/react";

interface BodyPart {
  id: string;
  name: string;
  path: string;
}

const bodyParts: BodyPart[] = [
  { id: "head", name: "Толгой", path: "M150 40 L130 50 L130 80 L150 90 L170 80 L170 50 Z" },
  { id: "chest", name: "Цээж", path: "M150 90 L110 100 L100 150 L120 180 L180 180 L200 150 L190 100 Z" },
  { id: "stomach", name: "Гэдэс", path: "M120 180 L110 220 L130 260 L170 260 L190 220 L180 180 Z" },
  { id: "left-arm", name: "Зүүн гар", path: "M110 100 L80 110 L70 150 L75 190 L85 190 L90 150 L100 110 Z" },
  { id: "right-arm", name: "Баруун гар", path: "M190 100 L220 110 L230 150 L225 190 L215 190 L210 150 L200 110 Z" },
  { id: "left-leg", name: "Зүүн хөл", path: "M130 260 L125 300 L120 350 L130 360 L140 350 L145 300 Z" },
  { id: "right-leg", name: "Баруун хөл", path: "M170 260 L175 300 L180 350 L170 360 L160 350 L155 300 Z" },
];

interface HumanBodyModelProps {
  selectedParts: string[];
  onPartSelect: (partId: string) => void;
}

export function HumanBodyModel({ selectedParts, onPartSelect }: HumanBodyModelProps) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 300 400"
        className="w-full max-w-sm mx-auto"
        style={{ maxHeight: "400px" }}
      >
        {}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {bodyParts.map((part) => {
          const isSelected = selectedParts.includes(part.id);
          return (
            <g key={part.id}>
              <motion.path
                d={part.path}
                fill={isSelected ? "#3B82F6" : "#E3F2FD"}
                stroke={isSelected ? "#2563EB" : "#BFDBFE"}
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onClick={() => onPartSelect(part.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={false}
                animate={{
                  fill: isSelected ? "#3B82F6" : "#E3F2FD",
                  filter: isSelected ? "url(#glow)" : "none",
                }}
              />
              {isSelected && (
                <motion.circle
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  cx={getPathCenter(part.path).x}
                  cy={getPathCenter(part.path).y}
                  r="8"
                  fill="#EF4444"
                  stroke="#FFF"
                  strokeWidth="2"
                />
              )}
            </g>
          );
        })}
      </svg>

      {}
      {selectedParts.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {selectedParts.map((partId) => {
            const part = bodyParts.find((p) => p.id === partId);
            return (
              <motion.div
                key={partId}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2"
              >
                <span>{part?.name}</span>
                <button
                  onClick={() => onPartSelect(partId)}
                  className="w-4 h-4 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getPathCenter(path: string): { x: number; y: number } {
  const matches = path.match(/\d+/g);
  if (!matches) return { x: 150, y: 200 };
  const coords = matches.map(Number);
  const x = coords.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) / (coords.length / 2);
  const y = coords.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0) / (coords.length / 2);
  return { x, y };
}
