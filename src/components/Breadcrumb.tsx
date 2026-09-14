import { useNavigate } from 'react-router-dom';

interface BreadcrumbProps {
  path: string;
  showSort?: boolean;
  sortDesc?: boolean;
  onToggleSort?: () => void;
}

function SortAscIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V4" />
      <path d="M5 11l7-7 7 7" />
    </svg>
  );
}

function SortDescIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v16" />
      <path d="M19 13l-7 7-7-7" />
    </svg>
  );
}

export function Breadcrumb({ path, showSort, sortDesc, onToggleSort }: BreadcrumbProps) {
  const parts = path ? path.split('/') : [];
  const navigate = useNavigate();

  return (
    <div id="breadcrumb">
      <span className="bc-link" onClick={() => navigate('/')}>
        根目录
      </span>
      {parts.map((part, i) => {
        const cumulative = parts.slice(0, i + 1).join('/');
        const isLast = i === parts.length - 1;
        return (
          <span key={cumulative}>
            <span className="bc-sep">{' \u203A '}</span>
            {isLast ? (
              <span className="bc-current">{part}</span>
            ) : (
              <span
                className="bc-link"
                onClick={() => {
                  navigate('/' + cumulative.replace(/#/g, '%23'));
                }}
              >
                {part}
              </span>
            )}
            {isLast && showSort && (
              <button
                type="button"
                className="bc-sort-btn"
                title={sortDesc ? '当前倒序，点击切换为正序' : '当前正序，点击切换为倒序'}
                aria-label={sortDesc ? '切换为正序' : '切换为倒序'}
                onClick={onToggleSort}
              >
                {sortDesc ? <SortDescIcon /> : <SortAscIcon />}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
