import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { ToolBarItemEnum } from '../../store/workspaceStore';
import { TOOLBAR_CONFIG } from './toolbarConfig';

function getToolLabel(toolName: ToolBarItemEnum) {
  return TOOLBAR_CONFIG[toolName]?.label ?? toolName;
}

export const Toolbar = observer(() => {
  const store = useStore();

  const handleToolClick = (toolName: ToolBarItemEnum) => {
    if (toolName === ToolBarItemEnum.Text) {
      store.setEditMode('text');
      return;
    }

    if (toolName === ToolBarItemEnum.UploadImage) {
      console.info('[Toolbar] upload image is not implemented yet.');
    }
  };

  return (
    <div className="toolbar-container" aria-label="Canvas toolbar">
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
