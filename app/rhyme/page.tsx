import { RhymeGame } from '../../components/RhymeGame/RhymeGame';
import classes from '../../components/TypingGame/TypingGame.module.css';

export default function RhymePage() {
  return (
    <main className={classes.gameWrapper}>
      <RhymeGame />
    </main>
  );
}
