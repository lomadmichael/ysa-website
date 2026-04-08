'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useCallback } from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL을 입력하세요');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('이미지 URL을 입력하세요');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-foam rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b border-foam bg-white">
        <ToolButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          label="Bold"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          label="Italic"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          label="H2"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          label="H3"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          label="Bullet"
        />
        <ToolButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          label="Number"
        />
        <ToolButton onClick={addLink} active={editor.isActive('link')} label="Link" />
        <ToolButton onClick={addImage} active={false} label="Image" />
      </div>
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[300px] bg-white focus:outline-none"
      />
    </div>
  );
}

function ToolButton({
  onClick,
  active,
  label,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
        active
          ? 'bg-ocean text-white'
          : 'bg-foam text-navy hover:bg-teal hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
