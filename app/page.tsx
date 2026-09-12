import {
  IconClock,
  IconMusic,
  IconNumbers,
  IconQuestionMark,
  IconTypography,
} from '@tabler/icons-react';
import Link from 'next/link';
import type React from 'react';
import classes from './page.module.css';

interface GameTile {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  className: string;
}

const GAMES: GameTile[] = [
  {
    href: '/words',
    title: 'Words',
    description: 'Spell familiar names and everyday words letter by letter',
    icon: <IconTypography size={44} stroke={2.2} />,
    className: classes.tileWords,
  },
  {
    href: '/counting',
    title: 'Counting',
    description: 'Count friendly animals and spell numbers 1 to 20',
    icon: <IconNumbers size={44} stroke={2.2} />,
    className: classes.tileCounting,
  },
  {
    href: '/clock',
    title: 'Clock',
    description: 'Read the analog clock and type the spoken time',
    icon: <IconClock size={44} stroke={2.2} />,
    className: classes.tileClock,
  },
  {
    href: '/quiz',
    title: 'Quiz',
    description: 'Listen to the word and pick the correct photo',
    icon: <IconQuestionMark size={44} stroke={2.2} />,
    className: classes.tileQuiz,
  },
  {
    href: '/rhyme',
    title: 'Rhyme Time',
    description: 'Pick words that rhyme and hear playful sounds',
    icon: <IconMusic size={44} stroke={2.2} />,
    className: classes.tileRhyme,
  },
];

export default function HomePage() {
  return (
    <main className={classes.launcherContainer}>
      <div className={classes.header}>
        <h1 className={classes.title}>Letter Trail</h1>
        <p className={classes.subtitle}>Choose an activity to play and learn</p>
      </div>

      <div className={classes.grid}>
        {GAMES.map((game) => (
          <Link key={game.href} href={game.href} className={`${classes.tile} ${game.className}`}>
            <div className={classes.iconWrapper}>{game.icon}</div>
            <h2 className={classes.tileTitle}>{game.title}</h2>
            <p className={classes.tileDescription}>{game.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
