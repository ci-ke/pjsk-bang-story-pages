import { REPOS } from '../config';
import { Link } from 'react-router-dom';
import { HomeExtra, HOME_EXTRA_POSITION } from './HomeExtra';
import type { Node } from '../types';

interface DirListProps {
  path: string;
  children: Node[];
}

/* 轻量 SVG 图标 */
function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function DirList({ path, children }: DirListProps) {
  const isHome = !path;
  const showExtra = isHome;

  const filtered = isHome
    ? children.filter((item) => REPOS[item.name])
    : children;

  const repoOrder = Object.keys(REPOS);
  const sorted = [...filtered].sort((a, b) => {
    if (isHome) {
      return repoOrder.indexOf(a.name) - repoOrder.indexOf(b.name);
    }
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'dir' ? -1 : 1;
  });

  return (
    <div id="list">
      {showExtra && HOME_EXTRA_POSITION === 'top' && (
        <>
          <HomeExtra />
          <hr />
        </>
      )}

      {sorted.map((item) => {
        const itemPath = path ? path + '/' + item.name : item.name;
        const displayName = isHome && REPOS[item.name] ? REPOS[item.name] : item.name;
        const isDir = item.type === 'dir';

        return (
          <Link
            key={itemPath}
            className="dir-item"
            to={'/' + itemPath.replace(/#/g, '%23')}
          >
            <span className={`dir-icon ${isDir ? 'folder' : 'file'}`}>
              {isDir ? <FolderIcon /> : <FileIcon />}
            </span>
            <span className="dir-name">{displayName}</span>
          </Link>
        );
      })}

      {showExtra && HOME_EXTRA_POSITION === 'bottom' && (
        <>
          <hr />
          <HomeExtra />
        </>
      )}
    </div>
  );
}
