/// <reference types="vite/client" />

interface Window {
  webkitAudioContext?: typeof AudioContext;
}

interface HTMLAudioElement {
  _objectUrl?: string;
}
