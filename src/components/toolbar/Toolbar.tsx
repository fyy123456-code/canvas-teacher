import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useStore } from '../../store';
import { ElementStatus, ElementType, ToolBarItemEnum } from '../../store/workspaceStore';
import { TOOLBAR_CONFIG } from './toolbarConfig';

const MAX_IMAGE_SIZE_MB = 20;
const DEFAULT_IMAGE_MAX_WIDTH = 320;
const DEFAULT_IMAGE_MAX_HEIGHT = 240;

function getToolLabel(toolName: ToolBarItemEnum) {
  return TOOLBAR_CONFIG[toolName]?.label ?? toolName;
}

function getImageSize(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      resolve({
        width: image.width,
        height: image.height,
      });
    };
    image.onerror = reject;
    image.src = src;
  });
}

function getFittedImageSize(width: number, height: number) {
  const scale = Math.min(DEFAULT_IMAGE_MAX_WIDTH / width, DEFAULT_IMAGE_MAX_HEIGHT / height, 1);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export const Toolbar = observer(() => {
  const store = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLocalImageToCanvas = async (file: File) => {
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      window.alert(`图片不能超过 ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }

    const src = URL.createObjectURL(file);
    const imageSize = await getImageSize(src);
    const fittedSize = getFittedImageSize(imageSize.width, imageSize.height);
    const stageWidth = store.stage?.width() ?? window.innerWidth;
    const stageHeight = store.stage?.height() ?? window.innerHeight;
    const id = store.generateId('image');

    store.addElement({
      id,
      type: ElementType.IMAGE,
      status: ElementStatus.LOADED,
      file_name: file.name,
      src,
      x: Math.round((stageWidth - fittedSize.width) / 2),
      y: Math.round((stageHeight - fittedSize.height) / 2),
      width: fittedSize.width,
      height: fittedSize.height,
      opacity: 1,
    });
  };

  const handleImageInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    await addLocalImageToCanvas(file);
  };

  const handleToolClick = (toolName: ToolBarItemEnum) => {
    if (toolName === ToolBarItemEnum.Text) {
      store.setEditMode('text');
      return;
    }

    if (toolName === ToolBarItemEnum.UploadImage) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="toolbar-container" aria-label="Canvas toolbar">
      <input ref={fileInputRef} type="file" accept="image/*" className="toolbar-file-input" onChange={handleImageInputChange} />
      <div className="toolbar-panel">
        {store.toolbarList.map(({ toolName }) => {
          const isActive = toolName === ToolBarItemEnum.Text && store.editMode === 'text';

          return (
            <button
              key={toolName}
              type="button"
              className={isActive ? 'toolbar-button toolbar-button-active' : 'toolbar-button'}
              title={`${getToolLabel(toolName)} ${TOOLBAR_CONFIG[toolName]?.shortcut ?? ''}`.trim()}
              aria-pressed={isActive}
              onClick={() => handleToolClick(toolName)}
            >
              {getToolLabel(toolName)}
            </button>
          );
        })}
      </div>
    </div>
  );
});
