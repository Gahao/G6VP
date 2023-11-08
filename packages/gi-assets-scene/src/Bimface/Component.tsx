import type { IGIAC } from '@antv/gi-sdk';
import { extra } from '@antv/gi-sdk';
import React, { memo } from 'react';
import $i18n from '../i18n';
import BimfaceGraph from './BimfaceGraph';
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
}

const Bimface: React.FunctionComponent<MapModeProps> = props => {
  const GIAC = { ...props.GIAC };
  const { visible: defaultVisible, maxSize, minSize, placement, offset, highlightColor, backgroundColor } = props;
  const [visible, setVisible] = React.useState(defaultVisible);
  GIAC.title = visible
    ? '取消显示'
    : '显示模型';
  return (
    <>
      <GIAComponent
        //@ts-ignore
        GIAC={GIAC}
        onClick={() => {
          setVisible(true);
        }}
      />

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
