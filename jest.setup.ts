jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  Redirect: () => null,
}));

jest.mock('lucide-react-native', () => ({
  Car: () => null, Calendar: () => null, UserCircle: () => null, Grid2X2: () => null,
  Plus: () => null, ChevronDown: () => null, ChevronUp: () => null, Copy: () => null,
  Pencil: () => null, Trash2: () => null, RotateCcw: () => null, Circle: () => null,
}));
