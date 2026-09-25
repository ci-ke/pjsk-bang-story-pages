// GitHub 仓库配置
export const OWNER = 'ci-ke';
export const BRANCH = 'main';

// 仓库名 → 显示名
export const REPOS: Record<string, string> = {
  'ProjectSekai-story': 'ProjectSekai-story',
  'BangDream-story': 'BangDream-story',
  'OurNotes-story': 'OurNotes-story'
};

// GitHub Raw 代理前缀
export const PROXY_PREFIX = 'https://ghfast.top/';

// 文件源码链接（文件页底部显示）
export interface SourceLink {
  label: string;
  baseUrl: string;
}
export const SOURCE_LINKS: SourceLink[] = [
  { label: 'GitHub', baseUrl: 'https://github.com' },
  { label: 'Gitee', baseUrl: 'https://gitee.com' },
];

// 首页自定义条目
export interface HomeExtraItem {
  text: string;
  url?: string;
  useProxy?: boolean;
}

export const HOME_EXTRA: HomeExtraItem[] = [
  { text: 'ProjectSekai-story 仓库', url: 'https://github.com/ci-ke/ProjectSekai-story' },
  { text: 'ProjectSekai-story 仓库（国内）', url: 'https://gitee.com/ci-ke/ProjectSekai-story' },
  { text: 'ProjectSekai-story 仓库下载', url: 'https://github.com/ci-ke/ProjectSekai-story/archive/refs/heads/main.zip' },
  { text: 'ProjectSekai-story 仓库下载（国内）', url: 'https://github.com/ci-ke/ProjectSekai-story/archive/refs/heads/main.zip', useProxy: true },
  { text: 'BangDream-story 仓库', url: 'https://github.com/ci-ke/BangDream-story' },
  { text: 'BangDream-story 仓库（国内）', url: 'https://gitee.com/ci-ke/BangDream-story' },
  { text: 'BangDream-story 仓库下载', url: 'https://github.com/ci-ke/BangDream-story/archive/refs/heads/main.zip' },
  { text: 'BangDream-story 仓库下载（国内）', url: 'https://github.com/ci-ke/BangDream-story/archive/refs/heads/main.zip', useProxy: true },
  { text: 'OurNotes-story 仓库', url: 'https://github.com/ci-ke/OurNotes-story' },
  { text: 'OurNotes-story 仓库（国内）', url: 'https://gitee.com/ci-ke/OurNotes-story' },
  { text: 'OurNotes-story 仓库下载', url: 'https://github.com/ci-ke/OurNotes-story/archive/refs/heads/main.zip' },
  { text: 'OurNotes-story 仓库下载（国内）', url: 'https://github.com/ci-ke/OurNotes-story/archive/refs/heads/main.zip', useProxy: true },
];

export const HOME_EXTRA_POSITION: 'top' | 'bottom' = 'bottom';
