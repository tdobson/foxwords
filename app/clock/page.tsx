import { ClockGame } from '../../components/ClockGame/ClockGame';
import classes from '../../components/TypingGame/TypingGame.module.css';

export default function ClockPage() {
  return (
    <main className={classes.gameWrapper}>
      <ClockGame />
    </main>
  );
}
