import {
  IconClock,
  IconKey,
  IconMusic,
  IconNumbers,
  IconPlayerPlay,
  IconQuestionMark,
  IconSettings,
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
    icon: <IconTypography size={40} stroke={2.2} />,
    className: classes.tileWords,
  },
  {
    href: '/counting',
    title: 'Counting',
    description: 'Count friendly animals and spell numbers 1 to 20',
    icon: <IconNumbers size={40} stroke={2.2} />,
    className: classes.tileCounting,
  },
  {
    href: '/clock',
    title: 'Clock',
    description: 'Read the analog clock and type the spoken time',
    icon: <IconClock size={40} stroke={2.2} />,
    className: classes.tileClock,
  },
  {
    href: '/quiz',
    title: 'Quiz',
    description: 'Listen to the word and pick the correct photo',
    icon: <IconQuestionMark size={40} stroke={2.2} />,
    className: classes.tileQuiz,
  },
  {
    href: '/rhyme',
    title: 'Rhyme Time',
    description: 'Pick words that rhyme and hear playful sounds',
    icon: <IconMusic size={40} stroke={2.2} />,
    className: classes.tileRhyme,
  },
];

export default function HomePage() {
  return (
    <main className={classes.launcherContainer}>
      <div className={classes.header}>
        <h1 className={classes.title}>Foxwords</h1>
        <p className={classes.subtitle}>
          Phonics, counting and clock games that sound like the people your child loves.
        </p>
        <div className={classes.privacyNotice}>
          Children never need an account. Grown-ups sign in with an email link to set things up.
        </div>
      </div>

      <div className={classes.pathCards}>
        <Link
          href="/parent/login"
          className={`${classes.pathCard} ${classes.parentCard}`}
          data-testid="parent-setup-button"
        >
          <span className={classes.pathIcon}>
            <IconSettings size={28} stroke={2.2} />
          </span>
          <span className={classes.pathTitle}>Set up for my child</span>
          <span className={classes.pathText}>
            Add your child&apos;s name and family names, record your own voices, then play on any
            device.
          </span>
        </Link>
        <Link
          href="/join"
          className={`${classes.pathCard} ${classes.joinCard}`}
          data-testid="join-code-button"
        >
          <span className={classes.pathIcon}>
            <IconKey size={28} stroke={2.2} />
          </span>
          <span className={classes.pathTitle}>I have a family code</span>
          <span className={classes.pathText}>
            Type the code from a grown-up to open your child&apos;s game on this device.
          </span>
        </Link>
      </div>

      <Link href="/words" className={classes.demoLink} data-testid="demo-game-button">
        <IconPlayerPlay size={18} />
        Try a demo game
      </Link>

      <div className={classes.sectionHeading}>Demo games</div>
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
