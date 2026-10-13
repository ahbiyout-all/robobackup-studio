// 1. 테마 식별자 및 인터페이스 (4대 표준 테마: 다크 / 회색 / 화이트 / 베이지)
export type ThemeId = 'dark' | 'grey' | 'white' | 'beige';

export interface ThemeConfig {
  id: ThemeId;
  name: string;          // 테마 표시 명칭 (다크, 회색, 화이트, 베이지)
  icon: string;          // 테마 아이콘 (🌙, 🌫️, ☀️, 🌾)
  primary: string;       // 주요 버튼/악센트 배경 클래스
  accent: string;        // 강조 색상
  bgFrom: string;        // 그라데이션 시작 배경
  bgTo: string;          // 그라데이션 끝 배경
  text: string;          // 기본 텍스트 색상
  card: string;          // 카드/패널 배경색 및 투명도
  border: string;        // 카드/구분선 테두리 색상
  terminal: string;      // 콘솔/터미널/로그 창 배경색
  isLight?: boolean;     // 라이트 테마 여부 (기본: false/다크)
  previewColor: string;  // 테마 선택기 프리뷰 컬러
}

// 2. 4종 테마 설정 데이터셋 (다크 2종 + 라이트 2종)
export const THEMES: Record<ThemeId, ThemeConfig> = {
  // [1. 다크 테마 - Deep Black]
  dark: { 
    id: 'dark',
    name: '다크', 
    icon: '🌙',
    primary: 'bg-zinc-800', 
    accent: 'blue-500', 
    bgFrom: 'bg-black', 
    bgTo: 'bg-zinc-950', 
    text: 'text-zinc-200', 
    card: 'bg-zinc-900/60', 
    border: 'border-zinc-800/80', 
    terminal: 'bg-black/95',
    isLight: false,
    previewColor: '#09090b'
  },
  // [2. 회색 테마 - Cool Grey]
  grey: { 
    id: 'grey',
    name: '회색', 
    icon: '🌫️',
    primary: 'bg-slate-800', 
    accent: 'sky-400', 
    bgFrom: 'bg-slate-900', 
    bgTo: 'bg-slate-950', 
    text: 'text-slate-200', 
    card: 'bg-slate-800/60', 
    border: 'border-slate-700/60', 
    terminal: 'bg-slate-950/95',
    isLight: false,
    previewColor: '#1e293b'
  },
  // [3. 화이트 테마 - Clean White]
  white: { 
    id: 'white',
    name: '화이트', 
    icon: '☀️',
    primary: 'bg-blue-600', 
    accent: 'blue-600', 
    bgFrom: 'bg-slate-50', 
    bgTo: 'bg-white', 
    text: 'text-slate-800', 
    card: 'bg-white/90', 
    border: 'border-slate-200', 
    terminal: 'bg-slate-900 text-slate-100',
    isLight: true,
    previewColor: '#ffffff'
  },
  // [4. 베이지 테마 - Warm Beige]
  beige: { 
    id: 'beige',
    name: '베이지', 
    icon: '🌾',
    primary: 'bg-amber-600', 
    accent: 'amber-700', 
    bgFrom: 'bg-[#faf8f5]', 
    bgTo: 'bg-[#eee9dc]', 
    text: 'text-[#3f392f]', 
    card: 'bg-white/85', 
    border: 'border-[#dfd8be]/80', 
    terminal: 'bg-[#2b261e] text-amber-100', 
    isLight: true,
    previewColor: '#eee9dc'
  }
};

export const THEME_LIST = [THEMES.dark, THEMES.grey, THEMES.white, THEMES.beige];
export const DARK_THEMES = [THEMES.dark, THEMES.grey];
export const LIGHT_THEMES = [THEMES.white, THEMES.beige];

