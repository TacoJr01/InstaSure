const accent = {
  coral:     '#E8843A',
  coralDim:  'rgba(232,132,58,0.12)',
  blue:      '#4A8FE8',
  blueDim:   'rgba(74,143,232,0.12)',
  green:     '#3EC97A',
  greenDim:  'rgba(62,201,122,0.12)',
  amber:     '#E8B84A',
  amberDim:  'rgba(232,184,74,0.12)',
  purple:    '#9B7AE8',
  purpleDim: 'rgba(155,122,232,0.12)',
};

export const darkColors = {
  bg:         '#0E0E12',
  surface:    '#16161A',
  surface2:   '#1C1C22',
  border:     '#1E1E28',
  border2:    '#2A2A36',
  text:       '#F2F0EA',
  text2:      '#C8C6C0',
  muted:      '#55556A',
  faint:      '#3A3A48',
  track:      '#1C1C24',
  rowDivider: '#13131A',
  ...accent,
};

export const lightColors = {
  bg:         '#F4F3EF',
  surface:    '#FFFFFF',
  surface2:   '#ECEAE5',
  border:     '#E2E0DB',
  border2:    '#CCCAC4',
  text:       '#141410',
  text2:      '#4A4844',
  muted:      '#888880',
  faint:      '#ABABAB',
  track:      '#E0DED8',
  rowDivider: '#F0EEEA',
  ...accent,
};

// backward compat — auth screens still import this
export const colors = darkColors;

export const fonts = {
  sans: 'System',
  mono: 'Courier',
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};
