import React from 'react';

const DEFAULT_TAGLINE = 'Ремонт смартфонов и электроники';

/**
 * Логотип для печати/PDF — SVG с фиксированными цветами (чётко в «Сохранить как PDF»).
 * «ПРО» — #84CC16, «ШИВКА» — #0A0A0C, как на сайте.
 */
export default function PrintBrandHeader({
  name = 'ПРОШИВКА',
  tagline = DEFAULT_TAGLINE,
}) {
  const accent = name.slice(0, 3).toUpperCase();
  const rest = name.slice(3).toUpperCase();
  const taglineText = (tagline || DEFAULT_TAGLINE).toUpperCase();

  return (
    <div className="op-brand-header">
      <svg
        className="op-brand-svg"
        viewBox="0 0 300 52"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={name}
      >
        <rect
          x="0.5"
          y="0.5"
          width="299"
          height="51"
          rx="7"
          fill="#FAFAFA"
          stroke="#84CC16"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
        <text
          x="14"
          y="23"
          fontFamily="'Segoe UI', Arial, Helvetica, sans-serif"
          fontSize="19"
          fontWeight="700"
          letterSpacing="-0.5"
        >
          <tspan fill="#84CC16">{accent}</tspan>
          <tspan fill="#0A0A0C">{rest}</tspan>
        </text>
        <line
          x1="14"
          y1="32"
          x2="286"
          y2="32"
          stroke="#84CC16"
          strokeOpacity="0.55"
          strokeWidth="1"
        />
        <text
          x="14"
          y="44"
          fill="#71717A"
          fontFamily="'Segoe UI', Arial, Helvetica, sans-serif"
          fontSize="7.5"
          fontWeight="600"
          letterSpacing="1.1"
        >
          {taglineText}
        </text>
      </svg>
    </div>
  );
}
