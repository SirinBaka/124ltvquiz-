import { useState, useEffect, useRef } from 'react';

type State = 'TYPING' | 'HOLDING' | 'DELETING' | 'WAITING';

interface Props {
  phrases: string[];
  typingSpeedMin?: number;
  typingSpeedMax?: number;
  deletingSpeedMin?: number;
  deletingSpeedMax?: number;
  holdDuration?: number;
  pauseDuration?: number;
  className?: string;
  cursorClassName?: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export function TypewriterHeadline({
  phrases,
  typingSpeedMin = 35,
  typingSpeedMax = 50,
  deletingSpeedMin = 20,
  deletingSpeedMax = 35,
  holdDuration = 1100,
  pauseDuration = 200,
  className = '',
  cursorClassName = ''
}: Props) {
  const [text, setText] = useState('');
  const [isFinishedTyping, setIsFinishedTyping] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Use refs to hold mutable state without triggering re-renders during the loop
  const stateRef = useRef<State>('TYPING');
  const phraseIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const shuffledPhrasesRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-trigger animation cleanly when class toggles
  const [finishKey, setFinishKey] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setText(phrases[0]);
      return;
    }

    if (shuffledPhrasesRef.current.length === 0) {
      shuffledPhrasesRef.current = shuffleArray(phrases);
    }

    const tick = () => {
      const currentPhrase = shuffledPhrasesRef.current[phraseIndexRef.current];
      const currentState = stateRef.current;

      if (currentState === 'TYPING') {
        setIsFinishedTyping(false);
        const nextCharIndex = charIndexRef.current + 1;
        setText(currentPhrase.substring(0, nextCharIndex));
        charIndexRef.current = nextCharIndex;

        if (nextCharIndex === currentPhrase.length) {
          stateRef.current = 'HOLDING';
          setIsFinishedTyping(true);
          setFinishKey(k => k + 1);
          timerRef.current = setTimeout(tick, holdDuration);
        } else {
          const delay = Math.random() * (typingSpeedMax - typingSpeedMin) + typingSpeedMin;
          timerRef.current = setTimeout(tick, delay);
        }
      } else if (currentState === 'HOLDING') {
        stateRef.current = 'DELETING';
        setIsFinishedTyping(false);
        timerRef.current = setTimeout(tick, 30); // small initial delay before deleting
      } else if (currentState === 'DELETING') {
        const nextCharIndex = charIndexRef.current - 1;
        setText(currentPhrase.substring(0, nextCharIndex));
        charIndexRef.current = nextCharIndex;

        if (nextCharIndex === 0) {
          stateRef.current = 'WAITING';
          timerRef.current = setTimeout(tick, pauseDuration);
        } else {
          const delay = Math.random() * (deletingSpeedMax - deletingSpeedMin) + deletingSpeedMin;
          timerRef.current = setTimeout(tick, delay);
        }
      } else if (currentState === 'WAITING') {
        // Prepare next phrase
        let nextPhraseIndex = phraseIndexRef.current + 1;
        if (nextPhraseIndex >= shuffledPhrasesRef.current.length) {
          const lastPhrase = shuffledPhrasesRef.current[shuffledPhrasesRef.current.length - 1];
          const newShuffle = shuffleArray(phrases);
          if (newShuffle[0] === lastPhrase && newShuffle.length > 1) {
            [newShuffle[0], newShuffle[1]] = [newShuffle[1], newShuffle[0]];
          }
          shuffledPhrasesRef.current = newShuffle;
          nextPhraseIndex = 0;
        }
        
        phraseIndexRef.current = nextPhraseIndex;
        stateRef.current = 'TYPING';
        timerRef.current = setTimeout(tick, 50);
      }
    };

    timerRef.current = setTimeout(tick, 100);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reducedMotion, phrases, typingSpeedMin, typingSpeedMax, deletingSpeedMin, deletingSpeedMax, holdDuration, pauseDuration]);

  return (
    <span className={`inline-flex items-center whitespace-pre-wrap ${className}`}>
      <span key={finishKey} className={isFinishedTyping ? 'animate-typewriter-finish' : ''} aria-hidden={!reducedMotion}>
        {text}
      </span>
      {/* Visually hidden for screen readers */}
      {!reducedMotion && <span className="sr-only">{phrases[0]}</span>}
      
      {!reducedMotion && (
        <span 
          className={`inline-block w-[3px] h-[1.1em] ml-[2px] bg-current align-middle rounded-sm ${isFinishedTyping ? 'animate-cursor-blink' : ''} ${cursorClassName}`} 
        />
      )}
    </span>
  );
}
