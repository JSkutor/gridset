/** Top-level app pages (Q / W / E shortcuts). */
export const APP_NAV_TAB = {
  ROUTINE: 'routine',
  SET: 'set',
  LOG: 'log',
} as const;

export type AppNavTab = typeof APP_NAV_TAB[keyof typeof APP_NAV_TAB];

export const APP_NAV_TAB_IDS = [
  APP_NAV_TAB.ROUTINE,
  APP_NAV_TAB.SET,
  APP_NAV_TAB.LOG,
] as const satisfies readonly AppNavTab[];

export const APP_NAV_SHORTCUTS = {
  KeyQ: APP_NAV_TAB.ROUTINE,
  KeyW: APP_NAV_TAB.SET,
  KeyE: APP_NAV_TAB.LOG,
} as const satisfies Record<string, AppNavTab>;
