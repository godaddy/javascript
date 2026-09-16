import { useEffect, useMemo, useState } from 'react';

/** Everything the merchant can tune, each mapped to a package CSS variable. */
export interface Theme {
  color: string;
  onColor: string;
  radius: number;
  focus: string;
  error: string;
  // Button chrome
  paddingY: number;
  paddingX: number;
  minHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  uppercase: boolean;
  flat: boolean;
  outline: boolean;
  hover: boolean;
  badgeBackground: string;
  badgeColor: string;
  // Drawer surfaces
  surface: string;
  text: string;
  subtle: string;
  drawerBorder: string;
  drawerMuted: string;
  drawerGutter: number;
  dark: boolean;
}

export const DEFAULT_THEME: Theme = {
  color: '#303036',
  onColor: '#ffffff',
  radius: 10,
  focus: '#51515b',
  error: '#a31919',
  paddingY: 11,
  paddingX: 18,
  minHeight: 48,
  fontWeight: '400',
  uppercase: false,
  flat: false,
  outline: false,
  hover: true,
  badgeBackground: '',
  badgeColor: '',
  surface: '#ffffff',
  text: '#252529',
  subtle: '#ededf0',
  drawerBorder: '#e6e6e8',
  drawerMuted: '#68686f',
  drawerGutter: 16,
  dark: false,
};

const PRESETS: Record<string, Partial<Theme>> = {
  Default: {},
  Brand: {
    color: '#1f6feb',
    focus: '#1f6feb',
    radius: 999,
    fontWeight: '600',
    badgeBackground: '#e11d48',
    badgeColor: '#ffffff',
  },
  Outline: {
    color: '#0f172a',
    onColor: '#0f172a',
    outline: true,
    radius: 6,
    fontWeight: '600',
  },
  Minimal: {
    color: '#111111',
    radius: 0,
    flat: true,
    uppercase: true,
    fontWeight: '500',
    paddingY: 8,
    paddingX: 14,
    minHeight: 36,
  },
  Dark: {
    color: '#e4e4e7',
    onColor: '#18181b',
    focus: '#a1a1aa',
    flat: true,
    surface: '#18181b',
    text: '#f4f4f5',
    subtle: '#27272a',
    drawerBorder: '#3f3f46',
    drawerMuted: '#a1a1aa',
    dark: true,
  },
};

const STORAGE_KEY = 'commerce-elements:theme';

function load(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_THEME, ...JSON.parse(saved) } : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Build the CSS a merchant would paste into their site for this theme. */
export function themeToCss(theme: Theme): string {
  const vars = [
    `  --gddy-color: ${theme.color};`,
    `  --gddy-on-color: ${theme.outline ? theme.color : theme.onColor};`,
    `  --gddy-radius: ${theme.radius}px;`,
    `  --gddy-focus: ${theme.focus};`,
    `  --gddy-error: ${theme.error};`,
    `  --gddy-button-padding: ${theme.paddingY}px ${theme.paddingX}px;`,
    `  --gddy-button-min-height: ${theme.minHeight}px;`,
    `  --gddy-button-weight: ${theme.fontWeight};`,
    `  --gddy-surface: ${theme.surface};`,
    `  --gddy-text: ${theme.text};`,
    `  --gddy-subtle: ${theme.subtle};`,
    `  --gddy-border: ${theme.drawerBorder};`,
    `  --gddy-muted: ${theme.drawerMuted};`,
    `  --gddy-gutter: ${theme.drawerGutter}px;`,
  ];
  if (theme.dark) vars.push('  --gddy-color-scheme: dark;');
  if (theme.outline) {
    vars.push(
      '  --gddy-button-background: transparent;',
      '  --gddy-button-border: 2px solid var(--gddy-color);',
      '  --gddy-button-shadow: none;'
    );
  } else if (theme.flat) {
    vars.push(
      '  --gddy-button-background: var(--gddy-color);',
      '  --gddy-button-shadow: none;'
    );
  }
  if (!theme.hover)
    vars.push('  --gddy-hover-brightness: 1;', '  --gddy-active-brightness: 1;');
  if (theme.badgeBackground)
    vars.push(`  --gddy-badge-background: ${theme.badgeBackground};`);
  if (theme.badgeColor) vars.push(`  --gddy-badge-color: ${theme.badgeColor};`);
  const blocks = [`:root {\n${vars.join('\n')}\n}`];
  if (theme.uppercase) {
    blocks.push(
      `gddy-add-to-cart::part(button),\ngddy-buy-now::part(button),\ngddy-cart-button::part(button),\ngddy-payment-button::part(button) {\n  text-transform: uppercase;\n  letter-spacing: .04em;\n}`
    );
  }
  return blocks.join('\n\n');
}

/** Apply the theme to the live page through a single managed style tag. */
export function useAppliedTheme(theme: Theme): string {
  const css = useMemo(() => themeToCss(theme), [theme]);
  useEffect(() => {
    let tag = document.getElementById('gddy-live-theme');
    if (!tag) {
      tag = document.createElement('style');
      tag.id = 'gddy-live-theme';
      document.head.append(tag);
    }
    tag.textContent = css;
    document.body.classList.toggle('dark-demo', theme.dark);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }, [css, theme]);
  return css;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(load);
  const css = useAppliedTheme(theme);
  return { theme, setTheme, css };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className='field'>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function ThemePanel({
  theme,
  setTheme,
  css,
}: {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  css: string;
}) {
  const [copied, setCopied] = useState(false);
  const set = <K extends keyof Theme>(key: K, value: Theme[K]) =>
    setTheme({ ...theme, [key]: value });
  const color = (key: keyof Theme & string, label: string) => (
    <Field label={label}>
      <input
        type='color'
        value={(theme[key] as string) || '#000000'}
        onChange={event => set(key, event.target.value as never)}
      />
    </Field>
  );
  const range = (
    key: keyof Theme & string,
    label: string,
    min: number,
    max: number
  ) => (
    <Field label={`${label} (${theme[key]}px)`}>
      <input
        type='range'
        min={min}
        max={max}
        value={theme[key] as number}
        onChange={event => set(key, Number(event.target.value) as never)}
      />
    </Field>
  );
  const toggle = (key: keyof Theme & string, label: string) => (
    <label className='toggle'>
      <input
        type='checkbox'
        checked={Boolean(theme[key])}
        onChange={event => set(key, event.target.checked as never)}
      />
      <span>{label}</span>
    </label>
  );

  return (
    <aside className='panel' aria-label='Appearance'>
      <h2>Appearance</h2>
      <div className='presets'>
        {Object.entries(PRESETS).map(([name, preset]) => (
          <button
            type='button'
            key={name}
            onClick={() => setTheme({ ...DEFAULT_THEME, ...preset })}
          >
            {name}
          </button>
        ))}
      </div>

      <h3>Colors</h3>
      <p className='hint'>
        Every control below is a <code>--gddy-*</code> variable. Set them on{' '}
        <code>:root</code> or any ancestor; they reach the shadow root and the
        drawer.
      </p>
      {color('color', '--gddy-color')}
      {color('onColor', '--gddy-on-color')}
      {color('focus', '--gddy-focus')}
      {color('error', '--gddy-error')}

      <h3>Buttons</h3>
      {range('radius', '--gddy-radius', 0, 999)}
      {range('paddingY', 'Vertical padding', 4, 24)}
      {range('paddingX', 'Horizontal padding', 8, 40)}
      {range('minHeight', 'Min height', 28, 64)}
      <Field label='Font weight'>
        <select
          value={theme.fontWeight}
          onChange={event =>
            set('fontWeight', event.target.value as Theme['fontWeight'])
          }
        >
          <option value='400'>400</option>
          <option value='500'>500</option>
          <option value='600'>600</option>
          <option value='700'>700</option>
        </select>
      </Field>
      {toggle('flat', 'Flat (no gradient or shadow)')}
      {toggle('outline', 'Outline style')}
      {toggle('hover', 'Hover and press feedback')}
      {toggle('uppercase', 'Uppercase label (::part rule)')}
      {color('badgeBackground', 'Badge background')}
      {color('badgeColor', 'Badge text')}

      <h3>Drawer</h3>
      {color('surface', '--gddy-surface')}
      {color('text', '--gddy-text')}
      {color('subtle', '--gddy-subtle')}
      {color('drawerBorder', '--gddy-border')}
      {color('drawerMuted', '--gddy-muted')}
      {range('drawerGutter', '--gddy-gutter', 8, 32)}
      {toggle('dark', 'Dark color scheme for form controls')}

      <h3>Generated CSS</h3>
      <p className='hint'>Paste this into the storefront stylesheet.</p>
      <pre className='css'>{css}</pre>
      <div className='presets'>
        <button
          type='button'
          onClick={() => {
            void navigator.clipboard?.writeText(css).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? 'Copied' : 'Copy CSS'}
        </button>
        <button type='button' onClick={() => setTheme(DEFAULT_THEME)}>
          Reset
        </button>
      </div>
    </aside>
  );
}
