import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { OWNER, BRANCH, PROXY_PREFIX, REPOS, SOURCE_LINKS } from '../config';

/* 复制图标（SVG） */
function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

interface FileViewProps {
  filePath: string;
  prevPath: string | null;
  nextPath: string | null;
  proxyEnabled: boolean;
  wrapEnabled: boolean;
  onWrapChange: (v: boolean) => void;
  onProxyChange: (v: boolean) => void;
}

export function FileView({
  filePath,
  prevPath,
  nextPath,
  proxyEnabled,
  wrapEnabled,
  onWrapChange,
  onProxyChange,
}: FileViewProps) {
  const [content, setContent] = useState('');
  const rawTextRef = useRef('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const latestRequestRef = useRef(0);
  const navigate = useNavigate();

  /** 站内跳转到另一个文件（与目录列表一致，# 需转义） */
  const goToPath = useCallback((p: string) => {
    navigate('/' + p.replace(/#/g, '%23'));
  }, [navigate]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCopy = useCallback(async () => {
    const text = rawTextRef.current;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, []);

  const loadFile = useCallback(async (signal?: AbortSignal) => {
    const reqId = ++latestRequestRef.current;
    setLoading(true);
    setError(null);
    setContent('');

    try {
      const topLevel = filePath.split('/')[0];
      if (!REPOS[topLevel]) throw new Error('未知仓库：' + topLevel);

      const repoFilePath = filePath.split('/').slice(1).join('/');
      const rawBase = 'https://raw.githubusercontent.com';
      const baseURL = proxyEnabled ? PROXY_PREFIX + rawBase : rawBase;
      const rawURL = `${baseURL}/${OWNER}/${topLevel}/${BRANCH}/${repoFilePath}`;

      const res = await fetch(rawURL, { signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const text = await res.text();
      // 只有最新请求才更新结果，旧请求直接丢弃
      if (latestRequestRef.current !== reqId) return;
      rawTextRef.current = text;
      const urlRegex = /https?:\/\/[^\s）)】」』\]\[）)\],，。！？]+/g;
      const html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(urlRegex, (m) => {
          return `<a href="${m}" target="_blank" rel="noreferrer noopener">${m}</a>`;
        });
      setContent(html);
    } catch (e) {
      if (latestRequestRef.current !== reqId) return;
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError('加载失败：' + (e as Error).message);
    } finally {
      if (latestRequestRef.current === reqId) {
        setLoading(false);
      }
    }
  }, [filePath, proxyEnabled]);

  useEffect(() => {
    const ctrl = new AbortController();
    loadFile(ctrl.signal);
    return () => ctrl.abort();
  }, [loadFile]);

  const hasText = !!rawTextRef.current;

  // 计算在 GitHub / Gitee 上查看的源码链接
  const topLevel = filePath.split('/')[0];
  const repoName = REPOS[topLevel] ?? topLevel;
  const repoFilePath = filePath.split('/').slice(1).join('/');
  const sourceUrls = SOURCE_LINKS.map((link) => ({
    label: link.label,
    url: `${link.baseUrl}/${OWNER}/${repoName}/blob/${BRANCH}/${repoFilePath}`,
  }));

  return (
    <>
      {/* 工具栏始终显示，加载中也能切换国内加速 */}
      <div id="toolbar">
        <label className="toggle">
          <input
            type="checkbox"
            checked={wrapEnabled}
            onChange={(e) => onWrapChange(e.target.checked)}
          />
          <span className="toggle-track" />
          <span className="toggle-label">自动换行</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={proxyEnabled}
            onChange={(e) => onProxyChange(e.target.checked)}
          />
          <span className="toggle-track" />
          <span className="toggle-label">国内加速</span>
        </label>
        <span style={{ flex: 1 }} />
        <button className="copy-btn" onClick={handleCopy} disabled={!hasText}>
          <span className="copy-icon">{copied ? <CheckIcon /> : <CopyIcon />}</span>
          <span className="copy-label">{copied ? '已复制' : '复制全文'}</span>
        </button>
      </div>

      {loading && (
        <div id="loading">
          <div className="spinner" />
          <span>加载中...</span>
        </div>
      )}

      {error && (
        <div id="error">
          <div className="error-icon">!</div>
          <div>{error}</div>
        </div>
      )}

      {!loading && !error && (
        <div
          id="content"
          className={wrapEnabled ? '' : 'nowrap'}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}

      {/* 上一文件 / 回到顶部 / 下一文件，随正文一起加载完才显示 */}
      {!loading && !error && (
        <div id="file-nav">
          <button
            className="file-nav-btn"
            onClick={() => prevPath && goToPath(prevPath)}
            disabled={!prevPath}
          >
            上一文件
          </button>
          <button className="file-nav-btn" onClick={scrollToTop}>
            回到顶部
          </button>
          <button
            className="file-nav-btn"
            onClick={() => nextPath && goToPath(nextPath)}
            disabled={!nextPath}
          >
            下一文件
          </button>
        </div>
      )}

      <div id="source-links">
        <span className="source-label">在以下平台查看源文件：</span>
        {sourceUrls.map((link) => (
          <a
            key={link.label}
            className="source-link"
            href={link.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            {link.label}
          </a>
        ))}
      </div>
    </>
  );
}
