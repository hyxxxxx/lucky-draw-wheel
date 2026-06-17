export interface Prize {
  id: string;
  name: string;
  initialQuantity: number; // The user-defined amount
  currentQuantity: number; // Leftover amount
  color: string;           // Hex color for the wheel segment
}

export interface DrawLog {
  id: string;
  prizeId: string;
  prizeName: string;
  timestamp: string; // Formatted date/time
}

export interface WheelConfig {
  spinningDuration: number; // in milliseconds
  backgroundMusicOn: boolean;
  soundEffectsOn: boolean;
}
