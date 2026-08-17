import '@mantine/core/styles.css';
import './globals.css';
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import React from 'react';
import { theme } from '../theme';

export const metadata = {
  title: 'Letter Trail',
  description: 'A gentle typing game for learning to spell familiar words.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </body>
    </html>
  );
}
