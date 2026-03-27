import type { TerminalLine } from "../types/desktop";

const ASCII_ART = String.raw`                                                      __         
   _______  ____  ___________  ____  ___  ____   ____/ /__ _   __
  / ___/ / / / / / / ___/ __ \/ __ \/ _ \/ __ \ / __  / _ \ | / /
 (__  ) /_/ / /_/ / /  / /_/ / / / /  __/ / / // /_/ /  __/ |/ / 
/____/\__,_/\__,_/_/   \____/_/ /_/\___/_/ /_(_)__,_/\___/|___/ `;

const ASCII_ART_COMPACT = String.raw`                                            __        
  ___ __ ____ _________  ___  ___ ___   ___/ /__ _  __
 (_-</ // / // / __/ _ \/ _ \/ -_) _ \_/ _  / -_) |/ /
/___/\_,_/\_,_/_/  \___/_//_/\__/_//_(_)_,_/\__/|___/`;

function getAsciiArt(useCompactArt: boolean) {
  return useCompactArt ? ASCII_ART_COMPACT : ASCII_ART;
}

export function getInitialTerminalLines(useCompactArt: boolean): TerminalLine[] {
  return [
    { kind: "accent", value: getAsciiArt(useCompactArt) },
    { kind: "output", value: "system version 1.0.0" },
    { kind: "output", value: 'type "help" to get started' },
  ];
}
