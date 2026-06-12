import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useStore } from '../../store';
import { ElementStatus, ElementType } from '../../store/workspaceStore';
import { getImageSize } from '../../utils/image';

const TOOLBAR_ITEMS = [
  {
    id: 'hand',
    label: '手',
    title: '拖动画布',
  },
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

export const Toolbar = observer(() => {
  const store = useStore();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    for (const [index, file] of files.entries()) {
      const src = URL.createObjectURL(file);
      const { width, height } = await getImageSize(src);
      const id = store.generateId();

      store.addElement({
        id,
        type: ElementType.IMAGE,
        status: ElementStatus.LOADED,
        file_name: file.name,
        src,
        x: 80 + index * 24,
        y: 80 + index * 24,
        width,
        height,
      });
    }

    event.target.value = '';
  };

  const handleToolClick = (itemId: ToolbarItemId) => {
    if (itemId === 'hand') {
      const nextMode = store.editMode === 'viewport-drag' ? 'select' : 'viewport-drag';
      store.setEditMode(nextMode);
      store.viewport.setViewportDragMode(nextMode === 'viewport-drag');
      return;
    }

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
        multiple
        className="toolbar-file-input"
        onChange={handleImageFileChange}
      />
      <div className="toolbar-panel">
        {TOOLBAR_ITEMS.map((item) => {
          const isActive = item.id === 'hand' && store.editMode === 'viewport-drag';

          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? 'toolbar-button toolbar-button-active' : 'toolbar-button'}
              title={item.title}
              aria-pressed={isActive}
              onClick={() => handleToolClick(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});
