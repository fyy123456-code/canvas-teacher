import { ToolBarItemEnum } from '../../store/workspaceStore';

export interface ToolbarConfigItem {
  toolName: ToolBarItemEnum;
  label: string;
  shortcut: string;
}

export const TOOLBAR_CONFIG: Record<ToolBarItemEnum, ToolbarConfigItem> = {
  [ToolBarItemEnum.UploadImage]: {
    toolName: ToolBarItemEnum.UploadImage,
    label: '图片',
    shortcut: 'I',
  },
  [ToolBarItemEnum.Text]: {
    toolName: ToolBarItemEnum.Text,
    label: '文字',
    shortcut: 'T',
  },
};
