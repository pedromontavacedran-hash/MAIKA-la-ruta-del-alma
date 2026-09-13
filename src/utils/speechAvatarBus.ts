type Listener = () => void;

type Unsubscribe = () => void;

const startListeners = new Set<Listener>();
const wordListeners = new Set<Listener>();
const endListeners = new Set<Listener>();

export function subscribeToSpeechAvatar(
  onStart: Listener,
  onWord: Listener,
  onEnd: Listener
): Unsubscribe {
  startListeners.add(onStart);
  wordListeners.add(onWord);
  endListeners.add(onEnd);
  return () => {
    startListeners.delete(onStart);
    wordListeners.delete(onWord);
    endListeners.delete(onEnd);
  };
}

export function emitSpeechStart(): void {
  startListeners.forEach((fn) => fn());
}

export function emitSpeechWord(): void {
  wordListeners.forEach((fn) => fn());
}

export function emitSpeechEnd(): void {
  endListeners.forEach((fn) => fn());
}
