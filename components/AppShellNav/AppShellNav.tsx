'use client';

import { Button } from '@mantine/core';
import {
  IconClock,
  IconHome,
  IconMusic,
  IconNumbers,
  IconQuestionMark,
  IconTypography,
  IconUsers,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import classes from './AppShellNav.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  testId: string;
}

const GAME_NAV_ITEMS: NavItem[] = [
  {
    href: '/words',
    label: 'Words',
    icon: <IconTypography size={20} stroke={2.2} />,
    color: 'blue',
    testId: 'nav-words',
  },
  {
    href: '/counting',
    label: 'Counting',
    icon: <IconNumbers size={20} stroke={2.2} />,
    color: 'teal',
    testId: 'nav-counting',
  },
  {
    href: '/clock',
    label: 'Clock',
    icon: <IconClock size={20} stroke={2.2} />,
    color: 'orange',
    testId: 'nav-clock',
  },
  {
    href: '/quiz',
    label: 'Quiz',
    icon: <IconQuestionMark size={20} stroke={2.2} />,
    color: 'grape',
    testId: 'nav-quiz',
  },
  {
    href: '/rhyme',
    label: 'Rhyme',
    icon: <IconMusic size={20} stroke={2.2} />,
    color: 'pink',
    testId: 'nav-rhyme',
  },
];

const PARENT_PATH = '/parent';

function isParentPath(pathname: string): boolean {
  return pathname === PARENT_PATH || pathname.startsWith(`${PARENT_PATH}/`);
}

export function AppShellNav() {
  const pathname = usePathname();

  // Hide nav bar entirely inside child play route launcher
  if (pathname?.startsWith('/play/')) {
    return null;
  }

  const isHomeActive = pathname === '/';
  const isGrownUpsActive = Boolean(pathname && isParentPath(pathname));
  const showGameLinks = !isGrownUpsActive && !pathname?.startsWith('/auth/');

  return (
    <header className={classes.navBar}>
      <div className={classes.homeSection}>
        <Button
          component={Link}
          href="/"
          variant={isHomeActive ? 'filled' : 'subtle'}
          color="indigo"
          radius="md"
          leftSection={<IconHome size={20} stroke={2.2} />}
          className={classes.navButton}
          aria-current={isHomeActive ? 'page' : undefined}
          data-active={isHomeActive ? 'true' : 'false'}
          data-testid="nav-home"
        >
          <span className={classes.buttonLabel}>Home</span>
        </Button>
      </div>

      <nav className={classes.linksSection} aria-label="Site navigation">
        {showGameLinks &&
          GAME_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                variant={isActive ? 'filled' : 'light'}
                color={item.color}
                radius="md"
                leftSection={item.icon}
                className={classes.navButton}
                aria-current={isActive ? 'page' : undefined}
                data-active={isActive ? 'true' : 'false'}
                data-testid={item.testId}
              >
                <span className={classes.buttonLabel}>{item.label}</span>
              </Button>
            );
          })}
        <Button
          component={Link}
          href={PARENT_PATH}
          variant={isGrownUpsActive ? 'filled' : 'outline'}
          color="indigo"
          radius="md"
          leftSection={<IconUsers size={20} stroke={2.2} />}
          className={classes.navButton}
          aria-current={isGrownUpsActive ? 'page' : undefined}
          data-active={isGrownUpsActive ? 'true' : 'false'}
          data-testid="nav-grown-ups"
        >
          <span className={classes.buttonLabel}>Grown-ups</span>
        </Button>
      </nav>
    </header>
  );
}
