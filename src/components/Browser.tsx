import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
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

  const [node, setNode] = useState<Node | null>(null);
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
    initialLoadDone.current = true;
  }, []);

  return (
    <>
      <Breadcrumb path={resolvedPath || path} />

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
          <DirList path={resolvedPath} children={node.children || []} />
        ) : (
          <FileView
            filePath={resolvedPath}
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
