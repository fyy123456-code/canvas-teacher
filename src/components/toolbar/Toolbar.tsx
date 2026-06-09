import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useStore } from '../../store';
import { ElementStatus, ElementType } from '../../store/workspaceStore';
import { getImageSize } from '../../utils/image';

const TOOLBAR_ITEMS = [
  {
    id: 'upload-image',
    label: '图片',
    title: '上传图片',
  },
  {
    id: 'text',
    label: '文字',
    title: '添加文字',
  },
] as const;

type ToolbarItemId = (typeof TOOLBAR_ITEMS)[number]['id'];

export function Toolbar() {
  const store = useStore();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const src = URL.createObjectURL(file);
    const { width, height } = await getImageSize(src);
    const id = store.generateId();

    store.addElement({
      id,
      type: ElementType.IMAGE,
      status: ElementStatus.LOADED,
      file_name: file.name,
      src,
      x: 80,
      y: 80,
      width,
      height,
    });

    event.target.value = '';
  };

  const handleToolClick = (itemId: ToolbarItemId) => {
    if (itemId === 'upload-image') {
      handleImageButtonClick();
    }
  };

  return (
    <div className="toolbar-container" aria-label="Canvas toolbar">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="toolbar-file-input"
        onChange={handleImageFileChange}
      />
      <div className="toolbar-panel">
        {TOOLBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="toolbar-button"
            title={item.title}
            onClick={() => handleToolClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
