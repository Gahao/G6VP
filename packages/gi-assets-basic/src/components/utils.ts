import { IEdge, INode } from '@antv/g6';
import { GIConfig, utils } from '@antv/gi-sdk';
import { GI_SITE } from './const';
import { notification } from 'antd';

const { getSiteContext } = utils;

/**
 *
 * @param graphData 画布中的图数据
 * @param ids 需要b被过滤的节点 id
 * @returns
 */
export const filterGraphDataByNodes = (graphData, ids: string[]) => {
  const { edges, nodes } = graphData;
  //const ids = targetNodes.map(node => node.getModel().id);
  const newEdges = edges.filter(edge => {
    const { source, target } = edge;
    if (ids.indexOf(source) !== -1 || ids.indexOf(target) !== -1) {
      return false;
    }
    return true;
  });
  const newNodes = nodes.filter(node => {
    return ids.indexOf(node.id) === -1;
  });
  return {
    nodes: newNodes,
    edges: newEdges,
  };
};

/**
 * 获取边上的另一节点
 */
export const getEdgeOtherNode = (edge: IEdge, node: INode) => {
  if (edge.getSource().getModel().id === edge.getTarget().getModel().id) return;
  const edgeModel = edge.getModel();
  return edgeModel.source === node.getModel().id ? edge.getTarget() : edge.getSource();
};

/**
 * 获取某一个节点的直接关联节点
 */
export const getUniRelativeNodes = (node: INode) => {
  const relativeEdges = node.getEdges();
  const relativeNodes = new Set() as Set<INode>;
  relativeEdges.forEach(edge => {
    const relativeNode = getEdgeOtherNode(edge, node);
    if (relativeNode) {
      relativeNodes.add(relativeNode);
    }
  });
  return Array.from(relativeNodes);
};

/**
 * 获得可以收起的节点
 */
export const getLeafNodes = (node: INode) => {
  const relativeEdges = node.getEdges();
  const relativeNodes = new Set() as Set<INode>;
  relativeEdges.forEach(edge => {
    const relativeNode = getEdgeOtherNode(edge, node);
    if (relativeNode) {
      const relativeNodeChildren = getUniRelativeNodes(relativeNode);
      if (!relativeNodeChildren.find(n => n.getModel().id !== node.getModel().id)) {
        relativeNodes.add(relativeNode);
      }
    }
  });
  return Array.from(relativeNodes);
};

export const getToolbarStyleByConfig = (config: GIConfig) => {
  //@ts-ignore
  const toolbarCfg = (config.components.find(c => c.id === 'Toolbar') || {
    id: 'Toolbar',
    props: {
      direction: 'horizontal',
      placement: 'LT',
      offset: [10, 10],
    },
  }) as {
    id: string;
    props: {
      direction?: 'horizontal' | 'vertical';
      placement: string;
      offset: number[];
    };
  };
  const { direction, placement, offset } = toolbarCfg.props;
  const positionStyles = utils.getPositionStyles(placement, offset);

  return {
    direction: direction,
    positionStyles,
  };
};


