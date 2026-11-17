import { applyMigrations, seedDatabase } from './seed';

export default async function globalSetup(): Promise<void> {
  await applyMigrations();
  await seedDatabase();
}
