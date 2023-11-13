import type { IGIAC } from '@antv/gi-sdk';
import { extra, useContext } from '@antv/gi-sdk';
import React, { memo, useEffect, useState } from 'react';
import $i18n from '../i18n';
import BimfaceGraph from './BimfaceGraph';
import { Menu } from 'antd';
import type { ContextMenuValue } from '@antv/graphin';
import { INode } from '@antv/g6';

const { SubMenu } = Menu;
const { GIAComponent } = extra;

export interface MapModeProps {
  GIAC: IGIAC;
  visible?: boolean;
  type: string;
  minSize: '200px';
  maxSize: '200px';
  placement: 'LT' | 'RT' | 'LB' | 'RB';
  offset: number[];
  highlightColor: string;
  backgroundColor: string;
  contextmenu: any;

}

const Bimface: React.FunctionComponent<MapModeProps> = props => {
  const [targetNode, setTargetNode] = useState<INode>();
  const { contextmenu } = props;

  const GIAC = { ...props.GIAC };
  const { visible: defaultVisible, maxSize, minSize, placement, offset, highlightColor, backgroundColor } = props;
  const [visible, setVisible] = React.useState(defaultVisible);
  GIAC.title = visible
    ? '取消显示'
    : '显示模型';

  const handleNode = (propId?: string) =>{
    let data = targetNode?.getModel()?.data as any;
    let code = data['code'];
    let eqId = window.localStorage.setItem('eqId', code);
    setVisible(true);

  }

  useEffect(() => {
    if (contextmenu.item && !contextmenu.item.destroyed) {
      setTargetNode(contextmenu.item);
    }
  }, [contextmenu.item]);

  return (
    <>
      <Menu.Item key="select-exchange" eventKey="select-exchange" onClick={()=>{
        handleNode();
      }}>
      查看模型
    </Menu.Item>
      {visible && (
        <BimfaceGraph
          backgroundColor={backgroundColor}
          highlightColor={highlightColor}
          minSize={minSize}
          maxSize={maxSize}
          placement={placement}
          offset={offset}
          GIAC={GIAC}
          handleClick={() => {
            setVisible(false);
          }}
        />
      )}
    </>
  );
};

export default memo(Bimface);
