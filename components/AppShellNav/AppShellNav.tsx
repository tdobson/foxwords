'use client';

import { Button } from '@mantine/core';
import {
  IconClock,
  IconHome,
  IconMusic,
  IconNumbers,
  IconQuestionMark,
  IconTypography,
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
}

const GAME_NAV_ITEMS: NavItem[] = [
  {
    href: '/words',
    label: 'Words',
    icon: <IconTypography size={20} stroke={2.2} />,
    color: 'blue',
  },
  {
    href: '/counting',
    label: 'Counting',
    icon: <IconNumbers size={20} stroke={2.2} />,
    color: 'teal',
  },
  {
    href: '/clock',
    label: 'Clock',
    icon: <IconClock size={20} stroke={2.2} />,
    color: 'orange',
  },
  {
    href: '/quiz',
    label: 'Quiz',
    icon: <IconQuestionMark size={20} stroke={2.2} />,
    color: 'grape',
  },
  {
    href: '/rhyme',
    label: 'Rhyme',
    icon: <IconMusic size={20} stroke={2.2} />,
    color: 'pink',
  },
];

export function AppShellNav() {
  const pathname = usePathname();

  const isHomeActive = pathname === '/';

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
        >
          <span className={classes.buttonLabel}>Home</span>
        </Button>
      </div>

      <nav className={classes.linksSection} aria-label="Game navigation">
        {GAME_NAV_ITEMS.map((item) => {
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
            >
              <span className={classes.buttonLabel}>{item.label}</span>
            </Button>
          );
        })}
      </nav>
    </header>
  );
}
