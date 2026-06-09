import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';

export const ZoomTools = observer(() => {
  const store = useStore();

  return (
    <div className="zoom-tools-container" aria-label="Canvas zoom tools">
      <button type="button" className="zoom-tool-button" title="缩小" onClick={() => store.zoomOutViewport()}>
        -
      </button>
      <button type="button" className="zoom-tool-button" title="放大" onClick={() => store.zoomInViewport()}>
        +
      </button>
    </div>
  );
});
