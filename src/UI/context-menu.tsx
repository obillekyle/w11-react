import "./context-menu.scss";
import * as CM from "@radix-ui/react-context-menu";
import { ReactNode } from "react";

type ContextItemProps = {
  children?: ReactNode;
  icon?: ReactNode;
  right?: ReactNode;
  disabled?: boolean;
  sub?: ReactNode;
  props?: {
    icon?: CM.ContextMenuItemIndicatorProps;
    right?: CM.ContextMenuArrowProps;
  };
} & CM.ContextMenuItemProps;

const ContextMenu = (p: any, c: any) => CM.ContextMenu(p, c);
ContextMenu.Body = ({ children }: any) => {
  return (
    <CM.Portal>
      <CM.Content>{children}</CM.Content>
    </CM.Portal>
  );
};

ContextMenu.Separator = CM.Separator;
ContextMenu.Group = CM.Group;
ContextMenu.Target = CM.Trigger;
ContextMenu.Item = ({
  children,
  right,
  icon,
  props,
  sub,
  ...other
}: ContextItemProps) => {
  const Parent = icon ? CM.CheckboxItem : CM.Item;

  return (
    <Parent {...other} defaultChecked={true}>
      {children}
      {right && <div className="right-item">{right}</div>}
      {icon && <CM.ItemIndicator>{icon}</CM.ItemIndicator>}
    </Parent>
  );
};

export default ContextMenu;
