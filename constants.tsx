
import React from 'react';
import { PerformanceRating } from './types';

export const LIGHT_COUNT = 5;

export const getRating = (ms: number): { label: string; rating: PerformanceRating; color: string } => {
  if (ms < 150) return { label: 'INSANELY FAST', rating: 'INSANE', color: 'text-purple-400' };
  if (ms < 200) return { label: 'PURPLE SECTOR', rating: 'PURPLE', color: 'text-f1-red' };
  if (ms < 250) return { label: 'GOOD PACE', rating: 'GOOD', color: 'text-green-400' };
  if (ms < 350) return { label: 'AVERAGE', rating: 'AVERAGE', color: 'text-yellow-400' };
  if (ms < 500) return { label: 'SLOW', rating: 'SLOW', color: 'text-orange-400' };
  return { label: 'GLACIAL', rating: 'GLACIAL', color: 'text-gray-400' };
};

export const getRandomDelay = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
