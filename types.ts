
export enum GameState {
  IDLE = 'IDLE',
  READY = 'READY',
  SEQUENCING = 'SEQUENCING',
  WAITING_FOR_GO = 'WAITING_FOR_GO',
  REACTION = 'REACTION',
  RESULT = 'RESULT',
  FALSE_START = 'FALSE_START'
}

export interface Attempt {
  id: string;
  timestamp: number;
  timeMs: number;
  category: string;
}

export type PerformanceRating = 'INSANE' | 'PURPLE' | 'GOOD' | 'AVERAGE' | 'SLOW' | 'GLACIAL';
