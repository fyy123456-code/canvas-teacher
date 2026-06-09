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

export function Toolbar() {
  return (
    <div className="toolbar-container" aria-label="Canvas toolbar">
      <div className="toolbar-panel">
        {TOOLBAR_ITEMS.map((item) => (
          <button key={item.id} type="button" className="toolbar-button" title={item.title}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
