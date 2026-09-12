import '@mantine/core/styles.css';
import './globals.css';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import type React from 'react';
import { AppShellNav } from '../components/AppShellNav/AppShellNav';
import { ProfileProvider } from '../lib/play/profile-context';
import { theme } from '../theme';

export const metadata = {
  title: 'Foxwords',
  description:
    'Foxwords is a joyful, personalised early-learning game with phonics spelling, interactive clocks, and family voice practice.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <ProfileProvider>
            <AppShellNav />
            {children}
          </ProfileProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
