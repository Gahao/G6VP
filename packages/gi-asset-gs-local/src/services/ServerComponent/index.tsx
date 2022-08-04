import { Alert, Button, Form, message, Radio, Space, Table } from 'antd';
import React, { useState } from 'react';
import {
  createGraphScopeInstance,
  loadChinaVisGraphToGraphScope,
  loadDefaultGraphToGraphScope,
  loadGraphToGraphScope,
  uploadLocalFileToGraphScope,
  queryGraphSchema,
} from '../GraphScopeService';
import {
  ChinaVisEdgeColumns,
  ChinaVisEdgeData,
  ChinaVisNodeColumns,
  ChinaVisNodeData,
  DefaultGraphScopeEdgeFilePath,
  DefaultGraphScopeNodeFilePath,
  LoadChinaVisDataSource,
} from '../Constants';
import GSDataMode from './GSDataMode';

export interface GraphModelProps {
  onClose: () => void;
}
const GraphScopeMode: React.FC<GraphModelProps> = ({ onClose }) => {
  const [form] = Form.useForm();

  const graphScopeFilesMapping = JSON.parse(localStorage.getItem('graphScopeFilesMapping') as string);

  const [dataType, setDataType] = useState('real');
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [filesMapping, setFilesMapping] = useState(graphScopeFilesMapping);
  const [formValue, setFormValue] = useState({});

  const handleDataTypeChange = e => {
    setDataType(e.target.value);
  };

  /**
   * 实例化GraphScope引擎实例
   */
  const initGraphScopeInstance = async () => {
    const projectId = localStorage.getItem('GI_ACTIVE_PROJECT_ID');

    if (!projectId) {
      message.error(`不存在 ID 为 ${projectId} 的项目`);
      return null;
    }
    // step1: 初始化 GraphScope 引擎
    const gsResult = await createGraphScopeInstance();

    if (!gsResult || !gsResult.success) {
      message.error(`创建 GraphScope 引擎实例失败: ${gsResult.message}`);
      return null;
    }

    const { data } = gsResult;
    const { instanceId } = data;

    return instanceId;
  };

  const handleUploadFiles = async (isCover = false) => {
    setUploadLoading(true);
    const currentInstanceId = await initGraphScopeInstance();
    const values = await form.validateFields();

    setFormValue(values);
    // 如果 isCover = false， 则需要先过滤掉 nodeConfigList, edgeConfigList 中已经存在于 localstorage 中的文件
    const { nodeConfigList, edgeConfigList = [] } = values;

    const nodeFileLists = nodeConfigList
      .filter(d => d.nodeFileList && d.nodeType)
      .filter(d => {
        // 过滤到不完整的配置后，还要再过滤掉已经上传过的文件
        if (!isCover && graphScopeFilesMapping) {
          const fileName = d.nodeFileList.file.name;
          return !graphScopeFilesMapping[fileName];
        }
        return true;
      })
      .map(d => d.nodeFileList);
    const nodeFilePromise = nodeFileLists.map(d => {
      // 上传点文件
      const nodeFileResult = uploadLocalFileToGraphScope({
        fileList: d,
        instanceId: currentInstanceId,
      });
      return nodeFileResult;
    });

    const edgeFileLists = edgeConfigList
      .filter(d => d.edgeType && d.edgeFileList && d.sourceNodeType && d.targetNodeType)
      .filter(d => {
        // 过滤到不完整的配置后，还要再过滤掉已经上传过的文件
        if (!isCover && graphScopeFilesMapping) {
          const fileName = d.edgeFileList.file.name;
          return !graphScopeFilesMapping[fileName];
        }
        return true;
      })
      .map(d => d.edgeFileList);
    const edgeFilePromise = edgeFileLists.map(d => {
      // 上传点文件
      const edgeFileResult = uploadLocalFileToGraphScope({
        fileList: d,
        instanceId: currentInstanceId,
      });
      return edgeFileResult;
    });

    const filesUploadResult = await Promise.all([...nodeFilePromise, ...edgeFilePromise]);

    setUploadLoading(false);
    // 所有文件上传成功后，开始载图
    // 验证是否有上传失败的
    const failedFile = filesUploadResult.find(d => !d.success);
    if (failedFile) {
      // 有文件上传失败，提示用户，停止后面的逻辑
      message.error('文件上传失败');
      return false;
    }

    // 构建 fileName: filePath 的对象
    const filePathMapping = {};
    filesUploadResult.forEach(d => {
      const { fileName, filePath } = d.data;
      filePathMapping[fileName] = filePath;
    });

    console.log('上传的文件对象', filePathMapping);
    const allUploadFiles = {
      ...filesMapping,
      ...filePathMapping,
    };
    setFilesMapping(allUploadFiles);

    localStorage.setItem('graphScopeFilesMapping', JSON.stringify(allUploadFiles));
    message.success('文件上传成功，可以点击进入分析开始载图并分析');
    return true;
  };

  const updateSchemaData = async modeType => {
    // 载图成功后，更新 Project 中的 SchemeData
    // 查询 GraphScope 中的 Schema
    const result = await queryGraphSchema();

    if (result && result.success) {
      // await updateProjectById(projectId, {
      //   schemaData: JSON.stringify(result.data),
      // })
    }
  };

  const handleSubmitForm = async () => {
    setLoading(true);
    // 使用示例数据
    if (dataType === 'demo') {
      const loadResult = await loadDefaultGraphToGraphScope({
        nodeFilePath: DefaultGraphScopeNodeFilePath,
        nodeType: 'v0',
        edgeType: 'e0',
        sourceNodeType: 'v0',
        targetNodeType: 'v0',
        edgeFilePath: DefaultGraphScopeEdgeFilePath,
        directed: true,
        delimiter: ',',
        hasHeaderRow: true,
      });

      setLoading(false);
      console.log('加载数据到 GraphScope', loadResult);
      // 每次载图以后，获取最新 Gremlin server
      const { success: loadSuccess, message: loadMessage, data } = loadResult;
      if (!loadSuccess) {
        message.error(`数据加载失败: ${loadMessage}`);
        return;
      }
      message.success('加载数据到 GraphScope 引擎成功');
      const { graphName, graphURL } = data;
      localStorage.setItem('graphScopeGraphName', graphName);

      // 载图成功后，更新 Project 中的 SchemeData
      updateSchemaData('LOCAL');
      // 关闭弹框
      onClose();
      return;
    }

    // 载图 ChinaVis 数据
    if (dataType === 'chinavis') {
      // loadChinaVisGraphToGraphScope
      const loadResult = await loadChinaVisGraphToGraphScope({
        dataSource: LoadChinaVisDataSource,
      });

      setLoading(false);
      console.log('加载数据到 GraphScope', loadResult);
      // 每次载图以后，获取最新 Gremlin server
      const { success: loadSuccess, message: loadMessage, data } = loadResult;
      if (!loadSuccess) {
        message.error(`数据加载失败: ${loadMessage}`);
        return;
      }
      message.success('加载数据到 GraphScope 引擎成功');
      const { graphName, graphURL } = data;
      localStorage.setItem('graphScopeGraphName', graphName);

      // 载图成功后，更新 Project 中的 SchemeData
      updateSchemaData('LOCAL');
      // 关闭弹框
      onClose();
      return;
    }

    // 没有上传文件
    if (!filesMapping) {
      message.error('请先上传文件后再进行载图');
      return;
    }

    const values = await form.validateFields();
    const { isStringType = true } = values;
    console.log('xxx', formValue, values);

    const {
      nodeConfigList,
      edgeConfigList = [],
      directed = true,
      delimiter = ',',
      hasHeaderRow = true,
    } = formValue as any;

    // 加上传的文件加载仅 GraphScope
    const loadResult = await loadGraphToGraphScope({
      nodeConfigList,
      edgeConfigList,
      fileMapping: filesMapping,
      directed,
      delimiter,
      hasHeaderRow,
      isStringType,
    });

    console.log('载图到 GraphScope 中', loadResult);
    setLoading(false);
    const { success: loadSuccess, message: loadMessage, data: loadData } = loadResult;
    if (!loadSuccess) {
      message.error(`数据加载失败: ${loadMessage}`);
      return;
    }

    const { graphName, graphURL } = loadData;
    localStorage.setItem('graphScopeGraphName', graphName);

    message.success('加载数据到 GraphScope 引擎成功');

    // 载图成功后，更新 Project 中的 SchemeData
    updateSchemaData('LOCAL');
    onClose();
  };

  const formInitValue = {
    type: 'LOCAL',
    directed: true,
    hasHeaderRow: true,
    delimiter: ',',
    nodeConfigList: [
      {
        nodeType: '',
      },
    ],
  };

  return (
    <div>
      <Form name="gsform" form={form} initialValues={formInitValue}>
        <Radio.Group defaultValue={dataType} buttonStyle="solid" onChange={handleDataTypeChange}>
          <Radio.Button value="demo">p2p示例数据</Radio.Button>
          <Radio.Button value="chinavis">ChinaVis示例数据</Radio.Button>
          <Radio.Button value="real">我有数据</Radio.Button>
        </Radio.Group>
        {loading && (
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 16, marginBottom: 16 }}
            message="正在将点边数据载入到 GraphScope 引擎中，请耐心等待……"
          />
        )}
        {dataType === 'demo' && (
          <div style={{ marginTop: 16 }}>
            <p>默认使用 GraphScope 引擎内置的点边数据，文件基本信息如下</p>
            <p>点文件名称：p2p-31_property_v_0</p>
            <p>边文件：p2p-31_property_e_0</p>
            <p>测试数据共包括 62586 节点，147892 条边</p>
          </div>
        )}
        {dataType === 'chinavis' && (
          <div style={{ marginTop: 16 }}>
            <p>
              默认使用ChinaVis 赛道1{' '}
              <a href="http://chinavis.org/2022/challenge.html" target="_blank">
                数据安全可视分析
              </a>
              的点边数据，文件基本信息如下
            </p>
            <p>点文件名称：Node.csv</p>
            <p>边文件：Link.csv</p>
            <p>测试数据共包括 237 万个与黑灰产相关的网络资产（节点）和 328 万条资产关联关系</p>
            <p>点类型：</p>
            <Table
              columns={ChinaVisNodeColumns}
              dataSource={ChinaVisNodeData}
              pagination={{ hideOnSinglePage: true }}
            />
            <p>边类型：</p>
            <Table
              columns={ChinaVisEdgeColumns}
              dataSource={ChinaVisEdgeData}
              pagination={{ hideOnSinglePage: true, pageSize: 11 }}
            />
          </div>
        )}
        {dataType === 'real' && (
          <GSDataMode
            handleUploadFile={handleUploadFiles}
            handleLoadData={handleSubmitForm}
            updateSchemaData={updateSchemaData}
            close={onClose}
            filesMapping={filesMapping}
            uploadLoading={uploadLoading}
            loading={loading}
            form={form}
          />
        )}
        {dataType !== 'real' && (
          <Form.Item>
            <Space style={{ marginTop: 16 }}>
              <Button onClick={onClose}>取消</Button>
              <Button
                type="primary"
                disabled={dataType === 'real' && !filesMapping}
                onClick={handleSubmitForm}
                loading={loading}
              >
                开始载图
              </Button>
            </Space>
          </Form.Item>
        )}
      </Form>
    </div>
  );
};

export default GraphScopeMode;