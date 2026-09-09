import React from 'react';
import { render, screen } from '@testing-library/react';
import { ClockFace, calculateHourAngle, calculateMinuteAngle } from './ClockFace';

describe('ClockFace', () => {
  describe('angle calculations', () => {
    it('calculates exact hour angles including minute fractions', () => {
      // 3:00 -> 3 * 30 = 90
      expect(calculateHourAngle(3, 0)).toBe(90);

      // 12:00 -> 0 degrees
      expect(calculateHourAngle(12, 0)).toBe(0);

      // 4:30 -> 4 * 30 + 15 = 135
      expect(calculateHourAngle(4, 30)).toBe(135);

      // 8:45 -> 8 * 30 + 22.5 = 262.5
      expect(calculateHourAngle(8, 45)).toBe(262.5);

      // 11:55 -> 11 * 30 + (55/60)*30 = 330 + 27.5 = 357.5
      expect(calculateHourAngle(11, 55)).toBe(357.5);
    });

    it('calculates minute angles accurately', () => {
      expect(calculateMinuteAngle(0)).toBe(0);
      expect(calculateMinuteAngle(15)).toBe(90);
      expect(calculateMinuteAngle(30)).toBe(180);
      expect(calculateMinuteAngle(45)).toBe(270);
      expect(calculateMinuteAngle(55)).toBe(330);
    });
  });

  describe('visual rendering', () => {
    it('renders with accessible aria-label', () => {
      render(<ClockFace hour={4} minute={30} spokenPhrase="It is half past 4" />);
      const clockSvg = screen.getByRole('img', {
        name: /analog clock displaying it is half past 4/i,
      });
      expect(clockSvg).toBeInTheDocument();
    });

    it('renders PAST and TO hemispheres and zone labels', () => {
      render(<ClockFace hour={3} minute={0} />);
      expect(screen.getByTestId('past-zone')).toBeInTheDocument();
      expect(screen.getByTestId('to-zone')).toBeInTheDocument();
      expect(screen.getByTestId('past-label')).toHaveTextContent(/past/i);
      expect(screen.getByTestId('to-label')).toHaveTextContent(/to/i);
    });

    it('renders hour numbers 1 through 12', () => {
      render(<ClockFace hour={12} minute={0} />);
      for (let h = 1; h <= 12; h++) {
        expect(screen.getByTestId(`hour-number-${h}`)).toHaveTextContent(String(h));
      }
    });

    it('sets correct rotation transform attributes on hour and minute hands', () => {
      render(<ClockFace hour={4} minute={30} />);

      const hourHand = screen.getByTestId('hour-hand');
      const minuteHand = screen.getByTestId('minute-hand');

      // 4:30 -> hour angle is 135 deg, minute angle is 180 deg
      expect(hourHand).toHaveAttribute('transform', 'rotate(135 150 150)');
      expect(minuteHand).toHaveAttribute('transform', 'rotate(180 150 150)');
    });

    it('renders minute markers around outer edge when enabled', () => {
      render(<ClockFace hour={8} minute={45} showMinuteMarkers />);
      expect(screen.getByTestId('minute-marker-15')).toBeInTheDocument();
      expect(screen.getByTestId('minute-marker-30')).toBeInTheDocument();
      expect(screen.getByTestId('minute-marker-45')).toBeInTheDocument();
    });
  });
});
