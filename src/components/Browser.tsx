import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFileTree } from '../hooks/useFileTree';
import { Breadcrumb } from './Breadcrumb';
import { DirList } from './DirList';
import { FileView } from './FileView';
import { ScrollHandle } from './ScrollHandle';
import type { Node } from '../types';

export function Browser() {
  const { '*': pathParam } = useParams();
  const path = (pathParam ?? '').replace(/\/+$/, '');
  const navigate = useNavigate();

  const { resolvePath } = useFileTree();

  const [wrapEnabled, setWrapEnabled] = useState(
    () => localStorage.getItem('wrapToggle') !== 'false',
  );
  const [proxyEnabled, setProxyEnabled] = useState(
    () => localStorage.getItem('proxyToggle') !== 'false',
  );
  const [sortDesc, setSortDesc] = useState(
    () => localStorage.getItem('sortDesc') === 'true',
  );

  const [node, setNode] = useState<Node | null>(null);
  const [siblings, setSiblings] = useState<Node[]>([]);
  const [resolvedPath, setResolvedPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialLoadDone = useRef(false);

  const route = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNode(null);
    window.scrollTo(0, 0);

    try {
      const result = await resolvePath(path);
      if (!result) {
        setError('路径不存在');
      } else {
        setNode(result.node);
        setSiblings(result.siblings);
        setResolvedPath(result.resolvedPath);

        if (result.resolvedPath !== path) {
          navigate('/' + result.resolvedPath.replace(/#/g, '%23'), { replace: true });
          setResolvedPath(result.resolvedPath);
        }
      }
    } catch (e) {
      setError('加载失败：' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path, resolvePath]);

  useEffect(() => {
    route();
  }, [route]);

  useEffect(() => {
    if (initialLoadDone.current) {
      localStorage.setItem('wrapToggle', String(wrapEnabled));
    }
  }, [wrapEnabled]);

  useEffect(() => {
    if (initialLoadDone.current) {
      localStorage.setItem('proxyToggle', String(proxyEnabled));
    }
  }, [proxyEnabled]);

  useEffect(() => {
    localStorage.setItem('sortDesc', String(sortDesc));
  }, [sortDesc]);

  useEffect(() => {
    initialLoadDone.current = true;
  }, []);

  const isRoot = !(resolvedPath || path);
  const isDir = node?.type === 'dir';

  // 同目录内按文件名正序（与列表的倒序开关无关）算出上一/下一个文件
  const { prevPath, nextPath } = useMemo(() => {
    if (!node || node.type !== 'file') return { prevPath: null, nextPath: null };
    const files = siblings
      .filter((s): s is Extract<Node, { type: 'file' }> => s.type === 'file')
      .sort((a, b) => a.name.localeCompare(b.name));
    const idx = files.findIndex((f) => f.name === node.name);
    if (idx === -1) return { prevPath: null, nextPath: null };
    const parentDir = resolvedPath.split('/').slice(0, -1).join('/');
    const join = (name: string) => (parentDir ? parentDir + '/' + name : name);
    return {
      prevPath: idx > 0 ? join(files[idx - 1].name) : null,
      nextPath: idx < files.length - 1 ? join(files[idx + 1].name) : null,
    };
  }, [node, siblings, resolvedPath]);

  return (
    <>
      <Breadcrumb
        path={resolvedPath || path}
        showSort={!isRoot && isDir}
        sortDesc={sortDesc}
        onToggleSort={() => setSortDesc((v) => !v)}
      />

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

      {!loading && !error && node && (
        node.type === 'dir' ? (
          <DirList path={resolvedPath} items={node.children || []} sortDesc={sortDesc} />
        ) : (
          <FileView
            filePath={resolvedPath}
            prevPath={prevPath}
            nextPath={nextPath}
            proxyEnabled={proxyEnabled}
            wrapEnabled={wrapEnabled}
            onWrapChange={setWrapEnabled}
            onProxyChange={setProxyEnabled}
          />
        )
      )}

      <ScrollHandle />
    </>
  );
}
