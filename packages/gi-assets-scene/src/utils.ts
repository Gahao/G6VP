import { GIConfig, utils } from '@antv/gi-sdk';
import { extend } from 'umi-request';
import type { RequestOptionsInit } from 'umi-request';
import { GI_SITE } from './const';
import { notification } from 'antd';

const { getSiteContext } = utils;

const errorHandler = error => {
  console.log('error', JSON.stringify(error));
  if (error.type === 'TypeError') {
    console.log('网路问题');
    notification.error({
      message: '网路问题',
      description: 'TypeError',
    });
  }
  throw error;
};
const _request = extend({
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
    'x-protocol-version': '1'
  },
  credentials: 'include',
  withCredentials: true, // 携带cookie
  errorHandler,
});

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

// 云端存储 入参转换逻辑
const getCompatibleOptions = (url: string, options: RequestOptionsInit) => {
  let finalUrl = url;
  const finalOptions = { ...options };
  finalOptions.method = 'post';
  if (url.endsWith('delete')) {
    // 兼容 云端存储服务 delete 关键字无法作为接口名
    finalUrl = url.replace('delete', 'remove');
  }
  if (options.data) {
    const { data } = options;
    const { name, datasetId, engineId, desc, id, ...rest } = data;
    const args = {
      name,
      datasetId,
      engineId,
      desc,
      id,
    }
    // if (Object.keys(rest).length) {
    //   args.params = rest
    // }
    finalOptions.data = { args: [args] };
  }
  return {
    url: finalUrl,
    options: finalOptions
  }
}

// 云端存储 出参转换逻辑
const getCompatibleResponse = (res: any) => {
  const { result, ...rest } = res;
  // 处理未登录逻辑
  if (!res.success) {
    const { code, data } = res.error || {};
    if (code === 'UNAUTHENTICATED_ERROR' && data?.redirectUrl) {
      window.location.replace(data.redirectUrl)
    }
  }
  if (!result) {
    return res;
  }
  // 兼容 云端服务返回 result 数据结构
  if (result.data) {
    const data = Array.isArray(result.data) ? result.data.map(({ params, ...datumRest }) => ({ ...datumRest, ...params })) : result.data;
    return {
      data,
      ...rest,
    }
  } else {
    const { params, ...resultRest } = result;
    return {
      ...rest,
      data: {
        ...resultRest,
        ...params
      }
    }
  }
}

export const request = async (url: string, options: RequestOptionsInit = { method: 'get' }) => {
  const { GI_SITE_ID } = getSiteContext();
  console.info('hi')

  if (GI_SITE_ID === 'DEFAULT' && GI_SITE.IS_INC_SITE) {
    console.info('hello')
    const { url: finalUrl, options: finalOptions } = getCompatibleOptions(url, options);
    url = finalUrl;
    options = finalOptions;
    return _request(url, options).then(res => {
      return getCompatibleResponse(res);
    });
  }
  return _request(url, options);}

