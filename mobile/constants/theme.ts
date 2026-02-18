/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2563EB';
const tintColorDark = '#60A5FA';

export const Colors = {
  light: {
    text: '#1E293B',
    background: '#F8FAFC',
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    cardBackground: '#FFFFFF',
    cardBorder: '#E2E8F0',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    accent: '#8B5CF6',
    headerGradientStart: '#2563EB',
    headerGradientEnd: '#7C3AED',
    surfaceElevated: '#FFFFFF',
  },
  dark: {
    text: '#F1F5F9',
    background: '#0F172A',
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#475569',
    tabIconSelected: tintColorDark,
    cardBackground: '#1E293B',
    cardBorder: '#334155',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    accent: '#A78BFA',
    headerGradientStart: '#1E40AF',
    headerGradientEnd: '#6D28D9',
    surfaceElevated: '#1E293B',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
