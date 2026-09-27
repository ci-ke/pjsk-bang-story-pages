import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFileTree } from '../hooks/useFileTree';
import { Breadcrumb } from './Breadcrumb';
import { DirList } from './DirList';
import { FileView } from './FileView';
import { ScrollHandle } from './ScrollHandle';
import type { Node } from '../types';

// 目录滚动位置记忆：key 为目录路径。只保留当前路径链（根目录 → 当前位置）上的记录，
// 进入新的路径时把链外的旧记录刷掉，因此缓存最多只有路径深度几条
const dirScrollMem = new Map<string, number>();

function pruneDirScroll(activePath: string) {
  for (const key of [...dirScrollMem.keys()]) {
    const onChain = key === '' || activePath === key || activePath.startsWith(key + '/');
    if (!onChain) dirScrollMem.delete(key);
  }
}

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
  // 上一个已加载完成的视图（用于离开目录时记录滚动位置）
  const prevViewRef = useRef<{ path: string; isDir: boolean } | null>(null);
  // 待恢复的目录滚动位置（列表渲染后生效）
  const pendingRestoreRef = useRef<number | null>(null);

  const route = useCallback(async () => {
    // 离开目录时记录当时的位置；同一路径重复执行（如 StrictMode）不记
    const prev = prevViewRef.current;
    if (prev && prev.path !== path && prev.isDir) {
      dirScrollMem.set(prev.path, window.scrollY);
    }
    pendingRestoreRef.current = null;

    setLoading(true);
    setError(null);
    setNode(null);
    window.scrollTo(0, 0);

    try {
      const result = await resolvePath(path);
      if (!result) {
        setError('路径不存在');
        prevViewRef.current = { path, isDir: false };
      } else {
        pruneDirScroll(result.resolvedPath);
        setNode(result.node);
        setSiblings(result.siblings);
        setResolvedPath(result.resolvedPath);
        prevViewRef.current = { path: result.resolvedPath, isDir: result.node.type === 'dir' };

        if (result.resolvedPath !== path) {
          navigate('/' + result.resolvedPath.replace(/#/g, '%23'), { replace: true });
          setResolvedPath(result.resolvedPath);
        }

        // 目录有记录点时，等列表渲染完再恢复
        if (result.node.type === 'dir') {
          const saved = dirScrollMem.get(result.resolvedPath);
          if (saved !== undefined && saved > 0) {
            pendingRestoreRef.current = saved;
          }
        }
      }
    } catch (e) {
      setError('加载失败：' + (e as Error).message);
      prevViewRef.current = { path, isDir: false };
    } finally {
      setLoading(false);
    }
  }, [path, resolvePath]);

  useEffect(() => {
    route();
  }, [route]);

  // 目录列表渲染完成后恢复记录的滚动位置
  useEffect(() => {
    if (loading || error || node?.type !== 'dir') return;
    const pos = pendingRestoreRef.current;
    if (pos === null) return;
    pendingRestoreRef.current = null;
    window.scrollTo(0, pos);
  }, [loading, error, node]);

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
