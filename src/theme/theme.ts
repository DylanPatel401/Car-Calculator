import { useColorScheme } from 'react-native';

export const lightColors = {
  background: '#F4F6F5',
  surface: '#FFFFFF',
  surfaceMuted: '#E9EEEB',
  text: '#15201B',
  textMuted: '#5F6D66',
  border: '#D5DDD8',
  primary: '#087A53',
  primarySoft: '#DDF3E9',
  warning: '#9A5A00',
  warningSoft: '#FFF1D6',
  danger: '#B3261E',
  dangerSoft: '#FCE8E6',
  tabInactive: '#718078',
} as const;

export const darkColors = {
  background: '#101512',
  surface: '#19211D',
  surfaceMuted: '#25302A',
  text: '#F1F5F2',
  textMuted: '#AEBBB4',
  border: '#34423B',
  primary: '#53D39A',
  primarySoft: '#193D2E',
  warning: '#F5B94C',
  warningSoft: '#3D2F16',
  danger: '#FF8A80',
  dangerSoft: '#411F1D',
  tabInactive: '#91A198',
} as const;

export type AppColors = { [K in keyof typeof lightColors]: string };

export function useAppTheme() {
  const scheme = useColorScheme();
  return { colors: scheme === 'dark' ? darkColors : lightColors, isDark: scheme === 'dark' };
}
