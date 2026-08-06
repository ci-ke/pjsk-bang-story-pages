import { useNavigate } from 'react-router-dom';

interface BreadcrumbProps {
  path: string;
}

export function Breadcrumb({ path }: BreadcrumbProps) {
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
          </span>
        );
      })}
    </div>
  );
}
