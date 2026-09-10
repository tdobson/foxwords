import React from 'react';
import classes from './ClockFace.module.css';

export interface ClockFaceProps {
  hour: number; // 1 - 12
  minute: number; // 0 - 59
  spokenPhrase?: string;
  showMinuteMarkers?: boolean;
}

export function calculateHourAngle(hour: number, minute: number): number {
  return ((hour % 12) + minute / 60) * 30;
}

export function calculateMinuteAngle(minute: number): number {
  return (minute % 60) * 6;
}

export function ClockFace({
  hour,
  minute,
  spokenPhrase = `Time is ${hour}:${minute.toString().padStart(2, '0')}`,
  showMinuteMarkers = true,
}: ClockFaceProps) {
  const center = 150;
  const radius = 135;
  const hourAngle = calculateHourAngle(hour, minute);
  const minuteAngle = calculateMinuteAngle(minute);

  // Hour numbers 1 to 12
  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Minute markers every 5 minutes
  const fiveMinuteIntervals = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className={classes.clockWrapper}>
      <svg
        className={classes.clockSvg}
        viewBox="0 0 300 300"
        role="img"
        aria-label={`Analog clock displaying ${spokenPhrase}`}
      >
        {/* Background dial */}
        <circle className={classes.outerRing} cx={center} cy={center} r={radius} />

        {/* Right hemisphere: PAST (12:00 to 6:00 -> from 0 to 180 degrees) */}
        {/* Path starts at (150, 15), arcs to (150, 285) on right, closes to center */}
        <path
          data-testid="past-zone"
          className={classes.pastHemisphere}
          d={`M ${center} ${center - radius} A ${radius} ${radius} 0 0 1 ${center} ${center + radius} Z`}
        />

        {/* Left hemisphere: TO (6:00 to 12:00 -> from 180 to 360 degrees) */}
        {/* Path starts at (150, 285), arcs to (150, 15) on left, closes to center */}
        <path
          data-testid="to-zone"
          className={classes.toHemisphere}
          d={`M ${center} ${center + radius} A ${radius} ${radius} 0 0 1 ${center} ${center - radius} Z`}
        />

        {/* Vertical divider between Past and To */}
        <line
          className={classes.centerDivide}
          x1={center}
          y1={center - radius + 10}
          x2={center}
          y2={center + radius - 10}
        />

        {/* PAST & TO Zone Labels */}
        <text
          x={center + 50}
          y={center - 35}
          className={`${classes.zoneBadgeText} ${classes.pastBadgeText}`}
          data-testid="past-label"
        >
          PAST ➔
        </text>
        <text
          x={center - 50}
          y={center - 35}
          className={`${classes.zoneBadgeText} ${classes.toBadgeText}`}
          data-testid="to-label"
        >
          ⬅ TO
        </text>

        {/* Ticks for each minute */}
        {Array.from({ length: 60 }).map((_, i) => {
          const isFiveMinute = i % 5 === 0;
          const tickAngle = i * 6;
          const tickLength = isFiveMinute ? 10 : 5;
          const outerR = radius - 4;
          const innerR = outerR - tickLength;
          const rad = (tickAngle - 90) * (Math.PI / 180);
          const x1 = center + innerR * Math.cos(rad);
          const y1 = center + innerR * Math.sin(rad);
          const x2 = center + outerR * Math.cos(rad);
          const y2 = center + outerR * Math.sin(rad);

          return (
            <line
              key={`tick-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={isFiveMinute ? classes.hourTick : classes.minuteTick}
            />
          );
        })}

        {/* Numbers 1-12 */}
        {hours.map((h) => {
          const angle = h * 30;
          const numRadius = radius - 28;
          const rad = (angle - 90) * (Math.PI / 180);
          const x = center + numRadius * Math.cos(rad);
          const y = center + numRadius * Math.sin(rad);

          return (
            <text
              key={`hour-${h}`}
              x={x}
              y={y}
              className={classes.hourNumber}
              data-testid={`hour-number-${h}`}
            >
              {h}
            </text>
          );
        })}

        {/* Optional 5-minute badge markers around edge */}
        {showMinuteMarkers &&
          fiveMinuteIntervals.map((m) => {
            const angle = m * 6;
            const markerRadius = radius + 14;
            const rad = (angle - 90) * (Math.PI / 180);
            const x = center + markerRadius * Math.cos(rad);
            const y = center + markerRadius * Math.sin(rad);

            // Minute description (e.g. 5, 10, 15, 20, 25, 30, 25, 20, 15, 10, 5)
            const minLabel = m === 0 ? '60' : `${m}`;

            return (
              <text
                key={`min-${m}`}
                x={x}
                y={y}
                className={classes.minuteBadge}
                data-testid={`minute-marker-${m}`}
              >
                {minLabel}
              </text>
            );
          })}

        {/* Hour Hand (Red #e03131, broad, prominent, classic clock spade hand) */}
        <g
          data-testid="hour-hand"
          className={classes.hourHand}
          transform={`rotate(${hourAngle} ${center} ${center})`}
        >
          {/* Counterweight tail */}
          <path
            d={`M ${center - 7} ${center} L ${center - 8} ${center + 22} A 8 8 0 0 0 ${center + 8} ${center + 22} L ${center + 7} ${center} Z`}
            fill="#b02525"
          />
          {/* Circular hub ring */}
          <circle cx={center} cy={center} r={17} fill="#b02525" />

          {/* Broad substantial body */}
          <path
            d={`M ${center - 7} ${center - 14} L ${center - 6} ${center - 40} L ${center - 14} ${center - 50} L ${center} ${center - 84} L ${center + 14} ${center - 50} L ${center + 6} ${center - 40} L ${center + 7} ${center - 14} Z`}
            fill="#e03131"
            stroke="#b02525"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inner diamond/arrow cutout for classic clock hand look */}
          <polygon
            points={`${center},${center - 52} ${center + 6},${center - 60} ${center},${center - 72} ${center - 6},${center - 60}`}
            fill="#ffe3e3"
            stroke="#b02525"
            strokeWidth="1.2"
          />
          {/* Center ridge highlight */}
          <line
            x1={center}
            y1={center - 12}
            x2={center}
            y2={center - 42}
            stroke="#ffc9c9"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* Minute Hand (Blue #1971c2, longer, slender, distinct pointer) */}
        <g
          data-testid="minute-hand"
          className={classes.minuteHand}
          transform={`rotate(${minuteAngle} ${center} ${center})`}
        >
          {/* Counterweight tail */}
          <path
            d={`M ${center - 5} ${center} L ${center - 6} ${center + 26} A 6 6 0 0 0 ${center + 6} ${center + 26} L ${center + 5} ${center} Z`}
            fill="#1864ab"
          />
          {/* Circular hub */}
          <circle cx={center} cy={center} r={13} fill="#1864ab" />

          {/* Minute hand body */}
          <path
            d={`M ${center - 4.5} ${center - 12} L ${center - 3.5} ${center - 86} L ${center - 8.5} ${center - 96} L ${center} ${center - 122} L ${center + 8.5} ${center - 96} L ${center + 3.5} ${center - 86} L ${center + 4.5} ${center - 12} Z`}
            fill="#1971c2"
            stroke="#1864ab"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Inner accent highlight */}
          <line
            x1={center}
            y1={center - 12}
            x2={center}
            y2={center - 114}
            stroke="#a5d8ff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Center arbor nut */}
        <circle className={classes.pin} cx={center} cy={center} r={10} />
        <circle className={classes.pinInner} cx={center} cy={center} r={5} />
        <circle cx={center} cy={center} r={2.5} fill="#e03131" />
      </svg>
    </div>
  );
}
