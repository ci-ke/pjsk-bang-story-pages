import { useRef, useCallback } from 'react';
import type { Node, DirNode } from '../types';

/**
 * 文件树管理 hook
 * - 根树加载与缓存
 * - 懒加载拆分点的子节点
 * - 模糊路径匹配
 */
export function useFileTree() {
  const treeRef = useRef<Node[] | null>(null);
  const lazyCacheRef = useRef<Record<string, Node[]>>({});

  /** 获取 file_list JSON 的基础 URL */
  const getFileListUrl = useCallback((path: string | null) => {
    const base = import.meta.env.BASE_URL;
    if (path) {
      return `${base}file_list/${path}/file_list.json`;
    }
    return `${base}file_list/file_list.json`;
  }, []);

  /** 加载根文件树 */
  const loadTree = useCallback(async (): Promise<Node[]> => {
    if (treeRef.current) return treeRef.current;

    const url = getFileListUrl(null);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`无法加载目录：${res.status}`);
    const data: Node[] = await res.json();
    treeRef.current = data;
    return data;
  }, [getFileListUrl]);

  /** 懒加载拆分点的子节点 */
  const loadLazyNode = useCallback(async (path: string): Promise<Node[]> => {
    if (lazyCacheRef.current[path]) return lazyCacheRef.current[path];

    const url = getFileListUrl(path);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`无法加载目录：${res.status}`);
    const children: Node[] = await res.json();
    lazyCacheRef.current[path] = children;
    return children;
  }, [getFileListUrl]);

  /** 模糊匹配路径：每段先精确匹配（大小写不敏感），失败则前缀匹配（唯一才命中） */
  const fuzzyFindNode = useCallback(async (
    tree: Node[],
    path: string,
  ): Promise<{ node: Node; resolvedPath: string; siblings: Node[] } | null> => {
    if (!path) {
      return { node: { type: 'dir', name: '', children: tree } as DirNode, resolvedPath: '', siblings: tree };
    }

    const parts = path.split('/');
    let nodes = tree;
    let node: Node | null = null;
    // 当前段所在的数组，即最终节点的兄弟节点集合
    let siblings = tree;
    const resolvedParts: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const partLower = part.toLowerCase();
      siblings = nodes;

      // 先精确匹配（大小写不敏感）
      let matched = nodes.find((n) => n.name.toLowerCase() === partLower) ?? null;

      if (!matched) {
        // 精确失败，找以该段开头的子节点
        const candidates = nodes.filter((n) =>
          n.name.toLowerCase().startsWith(partLower),
        );
        if (candidates.length === 1) {
          matched = candidates[0];
        } else {
          return null;
        }
      }

      resolvedParts.push(matched.name);
      node = matched;

      // 如果还有后续路径段，且当前节点是无 children 的拆分目录，先懒加载
      if (i < parts.length - 1 && node.type === 'dir' && !node.children) {
        const children = await loadLazyNode(resolvedParts.join('/'));
        node = { ...node, children } as DirNode;
      }

      nodes = (node as DirNode).children || [];
    }

    if (!node) return null;
    return { node, resolvedPath: resolvedParts.join('/'), siblings };
  }, [loadLazyNode]);

  /** 完整的路径解析：加载树 → 模糊查找 → 懒加载拆分点 */
  const resolvePath = useCallback(async (
    path: string,
  ): Promise<{ node: Node; resolvedPath: string; siblings: Node[] } | null> => {
    const tree = await loadTree();
    const result = await fuzzyFindNode(tree, path);
    if (!result) return null;

    // 如果找到的目录没有 children（拆分点），需要懒加载
    if (result.node.type === 'dir' && !result.node.children) {
      const children = await loadLazyNode(result.resolvedPath);
      result.node = { ...result.node, children } as DirNode;
    }

    return result;
  }, [loadTree, fuzzyFindNode, loadLazyNode]);

  /** 清除所有缓存（proxy 切换时需要清除 txt 内容缓存，但树结构不变） */
  const clearCache = useCallback(() => {
    treeRef.current = null;
    lazyCacheRef.current = {};
  }, []);

  return { loadTree, loadLazyNode, fuzzyFindNode, resolvePath, clearCache };
}
