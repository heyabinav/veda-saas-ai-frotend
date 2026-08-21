"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  File,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  Braces,
  Folder,
  FolderOpen,
  Plus,
  FolderPlus,
  PenLine,
  Trash2,
  Copy,
  FilePlus2,
  ClipboardList,
} from "lucide-react";
import type { FileNode } from "./ide-data";

function FileIcon({ path, className }: { path: string; className?: string }) {
  const name = path.split("/").pop()?.toLowerCase() ?? "";
  const ext = name.split(".").pop() ?? "";
  if (name === "package.json" || name === "tsconfig.json" || ext === "json")
    return <FileJson className={`h-4 w-4 shrink-0 ${className ?? ""}`} style={{ color: "#e5c07b" }} />;
  if (ext === "css")
    return <Braces className={`h-4 w-4 shrink-0 ${className ?? ""}`} style={{ color: "#61afef" }} />;
  if (ext === "md")
    return <FileText className={`h-4 w-4 shrink-0 ${className ?? ""}`} style={{ color: "#5fb3f5" }} />;
  if (ext === "svg")
    return <FileImage className={`h-4 w-4 shrink-0 ${className ?? ""}`} style={{ color: "#f0c674" }} />;
  if (ext === "ts" || ext === "tsx")
    return <FileCode className={`h-4 w-4 shrink-0 ${className ?? ""}`} style={{ color: "#519aba" }} />;
  if (ext === "js" || ext === "jsx")
    return <FileCode className={`h-4 w-4 shrink-0 ${className ?? ""}`} style={{ color: "#e8c4a0" }} />;
  return <File className={`h-4 w-4 shrink-0 ${className ?? ""}`} style={{ color: "#8b93a7" }} />;
}

type CtxItem = { label: string; icon: LucideIcon; danger?: boolean; action: () => void };

function ContextMenu({
  menu,
  onClose,
  onOpenFile,
  onToggle,
  onNewFile,
  onNewFolder,
  onRenameStart,
  onDelete,
  onCopyPath,
}: {
  menu: { x: number; y: number; path: string; type: "file" | "folder" } | null;
  onClose: () => void;
  onOpenFile: (path: string) => void;
  onToggle: (path: string) => void;
  onNewFile: (folderPath: string | null) => void;
  onNewFolder: (folderPath: string | null) => void;
  onRenameStart: (path: string) => void;
  onDelete: (path: string) => void;
  onCopyPath: (path: string) => void;
}) {
  if (!menu) return null;
  const isFolder = menu.type === "folder";
  const items: CtxItem[] = [
    ...(isFolder
      ? [{ label: "Expand Folder", icon: FolderOpen as LucideIcon, action: () => onToggle(menu.path) }]
      : [{ label: "Open File", icon: FileCode as LucideIcon, action: () => onOpenFile(menu.path) }]),
    { label: "New File", icon: FilePlus2, action: () => onNewFile(isFolder ? menu.path : null) },
    { label: "New Folder", icon: FolderPlus, action: () => onNewFolder(isFolder ? menu.path : null) },
    { label: "Rename", icon: PenLine, action: () => onRenameStart(menu.path) },
    { label: "Copy Path", icon: Copy, action: () => onCopyPath(menu.path) },
    { label: "Delete", icon: Trash2, danger: true, action: () => onDelete(menu.path) },
  ];
  const x = Math.min(menu.x, typeof window !== "undefined" ? window.innerWidth - 210 : menu.x);
  const y = Math.min(menu.y, typeof window !== "undefined" ? window.innerHeight - 250 : menu.y);
  return (
    <>
      <div className="fixed inset-0 z-[80]" onMouseDown={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="fixed z-[81] w-52 overflow-hidden rounded-lg border border-[#2a3348] bg-[#151a26] p-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
        style={{ left: x, top: y }}
      >
        <div className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5b6779]">
          {menu.path.split("/").pop()}
        </div>
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              item.action();
              onClose();
            }}
            className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[12.5px] transition-colors ${
              item.danger ? "text-red-400 hover:bg-red-500/10" : "text-[#c6cddb] hover:bg-[#222b3f] hover:text-white"
            }`}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

type TreeItemProps = {
  node: FileNode;
  depth: number;
  expanded: Set<string>;
  activePath: string | null;
  modified: Set<string>;
  untracked: Set<string>;
  renaming: string | null;
  forceOpen: boolean;
  onToggle: (path: string) => void;
  onOpenFile: (path: string) => void;
  onSelect: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  onRenameCommit: (path: string, newName: string) => void;
  onRenameCancel: () => void;
};

function TreeItem(props: TreeItemProps) {
  const {
    node,
    depth,
    expanded,
    activePath,
    modified,
    untracked,
    renaming,
    forceOpen,
    onToggle,
    onOpenFile,
    onSelect,
    onContextMenu,
    onRenameCommit,
    onRenameCancel,
  } = props;
  const isFolder = node.type === "folder";
  const isOpen = forceOpen || expanded.has(node.path);
  const isActive = activePath === node.path;
  const isModified = modified.has(node.path);
  const isUntracked = untracked.has(node.path);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming === node.path) inputRef.current?.select();
  }, [renaming, node.path]);

  return (
    <>
      <div
        onClick={() => {
          onSelect(node.path);
          if (isFolder) onToggle(node.path);
          else onOpenFile(node.path);
        }}
        onContextMenu={(e) => onContextMenu(e, node)}
        className={`group flex h-6 cursor-pointer items-center gap-1.5 pr-2 text-[12.5px] transition-colors ${
          isActive ? "bg-[#1d2534] text-[#e6e9f0]" : "text-[#9aa4b5] hover:bg-[#181f2d] hover:text-[#d4dae6]"
        }`}
        style={{ paddingLeft: 6 + depth * 12 }}
      >
        {isFolder ? (
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 text-[#5b6779] transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
          />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {isFolder && isOpen ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-[#7c8db5]" />
        ) : isFolder ? (
          <Folder className="h-4 w-4 shrink-0 text-[#7c8db5]" />
        ) : (
          <FileIcon path={node.path} />
        )}
        {renaming === node.path ? (
          <input
            ref={inputRef}
            defaultValue={node.name}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameCommit(node.path, (e.target as HTMLInputElement).value.trim());
              if (e.key === "Escape") onRenameCancel();
              e.stopPropagation();
            }}
            onBlur={(e) => onRenameCommit(node.path, (e.target as HTMLInputElement).value.trim())}
            className="min-w-0 flex-1 rounded-sm border border-indigo-500/60 bg-[#0d1017] px-1 py-0 text-[12px] text-white outline-none"
          />
        ) : (
          <span className="min-w-0 truncate">{node.name}</span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          {isModified && (
            <span className="rounded-sm px-1 text-[9.5px] font-bold text-amber-400">M</span>
          )}
          {isUntracked && (
            <span className="rounded-sm px-1 text-[9.5px] font-bold text-emerald-400">U</span>
          )}
        </span>
      </div>
      {isFolder && isOpen && node.children
        ? node.children.map((child) => <TreeItem key={child.path} {...props} node={child} depth={depth + 1} />)
        : null}
    </>
  );
}

function filterTree(nodes: FileNode[], q: string): FileNode[] {
  const lower = q.toLowerCase();
  const result: FileNode[] = [];
  for (const node of nodes) {
    if (node.type === "file") {
      if (node.name.toLowerCase().includes(lower)) result.push(node);
    } else {
      const children = node.children ? filterTree(node.children, q) : [];
      if (children.length > 0 || node.name.toLowerCase().includes(lower)) {
        result.push({ ...node, children: children.length > 0 ? children : node.children });
      }
    }
  }
  return result;
}

export default function FileTree(props: {
  nodes: FileNode[];
  expanded: Set<string>;
  activePath: string | null;
  modified: Set<string>;
  untracked: Set<string>;
  filter: string;
  renaming: string | null;
  onToggle: (path: string) => void;
  onOpenFile: (path: string) => void;
  onSelect: (path: string) => void;
  onRenameCommit: (path: string, newName: string) => void;
  onRenameCancel: () => void;
  onDelete: (path: string) => void;
  onCopyPath: (path: string) => void;
  onNewFile: (folderPath: string | null) => void;
  onNewFolder: (folderPath: string | null) => void;
  onRenameStart: (path: string) => void;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number; path: string; type: "file" | "folder" } | null>(null);
  const { nodes, filter, ...rest } = props;
  const visible = filter.trim() ? filterTree(nodes, filter.trim()) : nodes;
  const hasFilter = filter.trim().length > 0;

  return (
    <>
      <div className="flex-1 overflow-y-auto px-1 py-1 no-scrollbar">
        {visible.length === 0 ? (
          <div className="px-3 py-8 text-center text-[12px] text-[#5b6779]">
            No files match &quot;{filter.trim()}&quot;
          </div>
        ) : (
          visible.map((node) => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              forceOpen={hasFilter}
              onContextMenu={(e, n) => {
                e.preventDefault();
                setMenu({ x: e.clientX, y: e.clientY, path: n.path, type: n.type });
              }}
              {...rest}
            />
          ))
        )}
        <div className="flex h-8 items-center gap-1.5 px-2 text-[10.5px] text-[#5b6779]">
          <ClipboardList className="h-3 w-3" />
          {visible.length} {visible.length === 1 ? "item" : "items"}
        </div>
      </div>
      <ContextMenu
        menu={menu}
        onClose={() => setMenu(null)}
        onOpenFile={props.onOpenFile}
        onToggle={props.onToggle}
        onNewFile={props.onNewFile}
        onNewFolder={props.onNewFolder}
        onRenameStart={props.onRenameStart}
        onDelete={props.onDelete}
        onCopyPath={props.onCopyPath}
      />
    </>
  );
}

export { FileIcon };