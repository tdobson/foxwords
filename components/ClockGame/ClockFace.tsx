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

        {/* Hour Hand (Red #e03131, short, thick) */}
        {/* Drawn pointing straight up from (150, 150) to (150, 95) with length 55 */}
        <line
          data-testid="hour-hand"
          className={classes.hourHand}
          x1={center}
          y1={center + 8}
          x2={center}
          y2={center - 62}
          transform={`rotate(${hourAngle} ${center} ${center})`}
          stroke="#e03131"
        />

        {/* Minute Hand (Blue #1971c2, longer, slender) */}
        {/* Drawn pointing straight up from (150, 150) to (150, 60) with length 90 */}
        <line
          data-testid="minute-hand"
          className={classes.minuteHand}
          x1={center}
          y1={center + 12}
          x2={center}
          y2={center - 95}
          transform={`rotate(${minuteAngle} ${center} ${center})`}
          stroke="#1971c2"
        />

        {/* Center pin */}
        <circle className={classes.pin} cx={center} cy={center} r={7} />
        <circle className={classes.pinInner} cx={center} cy={center} r={3} />
      </svg>
    </div>
  );
}
