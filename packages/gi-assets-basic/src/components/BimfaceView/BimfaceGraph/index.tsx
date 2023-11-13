import { extra, IGIAC, useContext, utils } from '@antv/gi-sdk';
import * as React from 'react';
import ReactDOM from 'react-dom';
import AnimateContainer from '../../CommonCmponents/AnimateContainer';
import Toolbar from '../Toolbar';
import axios from 'axios';
import { message } from 'antd';

const { deepClone } = extra;


declare const BimfaceSDKLoaderConfig: any
declare const BimfaceSDKLoader: any
declare const Glodon: any

export interface ILargeGraph {
  GIAC: IGIAC;
  handleClick: () => void;
  minSize: string;
  maxSize: string;
  placement: 'LT' | 'RT' | 'LB' | 'RB';
  offset: number[];
  highlightColor: string;
  backgroundColor: string;
}

const Bimface: React.FunctionComponent<ILargeGraph> = props => {
  const {
    updateContext,
    source,
    largeGraphData,
    largeGraphLimit,
    data,
    GISDK_ID,
    apis,
    config,
    transform,
  } = useContext();
  const { GIAC, handleClick, maxSize, minSize, placement, offset, highlightColor, backgroundColor } = props;

  const [state, setState] = React.useState({
    toggle: false,
  });
  const { toggle } = state;

  const setToggle = (isToggle: boolean) => {
    setState(preState => {
      return {
        ...preState,
        toggle: isToggle,
      };
    });
  };
  const hasArrow = true;

  let componentProcessing;
  let componentArrPre;
  let app;
  React.useLayoutEffect(() => {
    let eqId = window.localStorage.getItem( 'eqId');
    //let eqId = '37';
    if (!eqId) {
      setToggle(true);
      message.error('设备Id不存在，无法显示模型');
      return;
    }
    getInfo(eqId);
  }, []);

  async function getInfo(eqId) {
    let requestUrl = 'http://192.168.103.21:8999/equipment-api/equipment/eqModel/selectEqModelinfoNoLogin?eqId=' + eqId;
    let res = await axios.get(requestUrl)
    if (res) {
      let data = res.data.result;
      let getViewToken = 'http://192.168.103.21:8999/equipment-api/equipment/bimface/getViewTokenOne';
      if(data === null){
        setToggle(true);
        message.error('设备模型不存在，无法显示模型');
        return;
      }
      message.info('正在打开模型，请稍后');

      let viewToken = await axios.get(getViewToken, {
        url: getViewToken,
        params: {
          fileId: data.modelId,
          fileType: data.modelType
        }  
      })
      componentProcessing = data.compntIds
      let loaderConfig = new BimfaceSDKLoaderConfig();
      loaderConfig.viewToken = viewToken.data.result;
      BimfaceSDKLoader.load(loaderConfig, successCallback, failureCallback);
    }
  }
  let viewer3D;
  function successCallback(viewMetaData) {
    let domShow = document.getElementById('gi-bimface-graph');
    let webAppConfig = new Glodon.Bimface.Viewer.Viewer3DConfig();
    webAppConfig.domElement = domShow;
    viewer3D = new Glodon.Bimface.Viewer.Viewer3D(webAppConfig);
    viewer3D.addView(viewMetaData.viewToken);
    viewer3D.addEventListener(Glodon.Bimface.Viewer.Viewer3DEvent.ViewAdded, function () {
      componentBlink(componentProcessing);
      // 渲染3D模型
      viewer3D.render();
    });
  }

  function componentBlink(ids) {
    if (!viewer3D || !viewer3D.getModel()) {
        return;
    }
    //首先清除其他闪烁
    // 清除构件强调
    viewer3D.getModel().clearAllBlinkComponents();
    let blinkColor = new Glodon.Web.Graphics.Color("#B22222", 0.8);
    // 打开构件强调开关
    viewer3D.enableBlinkComponents(true);
    // 给需要报警的构件添加强调状态
    viewer3D.getModel().addBlinkComponentsById(ids);
    // 设置强调状态下的颜色
    viewer3D.getModel().setBlinkColor(blinkColor);
    // 设置强调状态下的频率
    viewer3D.getModel().setBlinkIntervalTime(500);
    viewer3D.render();
}


  function failureCallback() {

  }



  React.useEffect(() => {

  }, [hasArrow, highlightColor, backgroundColor]);

  const handleToggle = () => {
    setToggle(!toggle);
  };

  return ReactDOM.createPortal(
    <AnimateContainer toggle={toggle} maxSize={maxSize} minSize={minSize} placement={placement} offset={offset}>
      <Toolbar
        GIAC={GIAC}
        config={config}
        handleSwitchMap={handleClick} // 切换渲染视图
        handleToggleMap={handleToggle} //大小视图
      ></Toolbar>
      <div
        id="gi-bimface-graph"
        style={{
          backgroundColor: 'white',
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
      </div>
    </AnimateContainer>,
    document.getElementById(`${GISDK_ID}-graphin-container`) as HTMLDivElement,
  );
};

export default Bimface;
