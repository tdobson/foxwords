/**
 * @jest-environment node
 */
import { getInputMode } from '../input-mode';

describe('getInputMode on the server', () => {
  it('returns hardware when there is no window', () => {
    expect(typeof window).toBe('undefined');
    expect(getInputMode()).toBe('hardware');
  });
});
