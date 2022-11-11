import * as GI_ASSETS_ADVANCE from '@antv/gi-assets-advance';
import * as GI_ASSETS_ALGORITHM from '@antv/gi-assets-algorithm';
import * as GI_ASSETS_BASIC from '@antv/gi-assets-basic';
import * as GI_ASSETS_GRAPHSCOPE from '@antv/gi-assets-graphscope';
import * as GI_ASSETS_GS from '@antv/gi-assets-graphscope';
import * as GI_ASSETS_NEO4J from '@antv/gi-assets-neo4j';
import * as GI_ASSETS_SCENE from '@antv/gi-assets-scene';

import { IS_LOCAL_ENV } from './services/const';

import { getPackages, isDev, OFFICIAL_PACKAGES } from '../.umirc';

// 业务包
export const BIZ_PACKAGES = !IS_LOCAL_ENV
  ? getPackages([
      // {
      //   name: '@alipay/gi-assets-yuque',
      //   version: '1.0.0',
      // },
      // {
      //   name: '@alipay/gi-assets-shaseng',
      //   version: '1.1.0',
      // },
      // {
      //   name: '@alipay/gi-assets-gs',
      //   version: '1.8.0',
      // },
      // {
      //   name: '@alipay/gi-assets-akg',
      //   version: '1.2.7',
      // },
    ])
  : [];

// setTimeout(() => {
//   // !isDev && window.console.clear();
//   console.log(
//     '%c Thanks to pomelo.lcw zhanning.bzn xuying.xu yunyi jingxi.lp Yanyan-Wang axu.zx xx361452 baihui yifeng yuqi.pyq yuran.lcl qingyu hexiaonan.hxn who have contributed code to GraphInsight',
//     'color: #ddd; font-size: 10px; font-style: italic;',
//   );
// }, 3000);
const OFFICIAL_PACKAGES_MAP = OFFICIAL_PACKAGES.reduce((acc, curr) => {
  return {
    ...acc,
    [curr.global]: curr,
  };
}, {});
const LOCAL_ASSETS = [
  /** 内置的资产 */
  {
    ...OFFICIAL_PACKAGES_MAP['GI_ASSETS_BASIC'],
    ...GI_ASSETS_BASIC,
  },
  {
    ...OFFICIAL_PACKAGES_MAP['GI_ASSETS_ADVANCE'],
    ...GI_ASSETS_ADVANCE,
  },
  {
    ...OFFICIAL_PACKAGES_MAP['GI_ASSETS_ALGORITHM'],
    ...GI_ASSETS_ALGORITHM,
  },
  {
    ...OFFICIAL_PACKAGES_MAP['GI_ASSETS_SCENE'],
    ...GI_ASSETS_SCENE,
  },
  /** 内置 GS 单机版 */
  {
    ...OFFICIAL_PACKAGES_MAP['GI_ASSETS_GS'],
    ...GI_ASSETS_GS,
  },
  // 内置 Neo4j
  {
    ...OFFICIAL_PACKAGES_MAP['GI_ASSETS_NEO4J'],
    ...GI_ASSETS_NEO4J,
  },
  // 内置 Neo4j
  {
    ...OFFICIAL_PACKAGES_MAP['GI_ASSETS_GRAPHSCOPE'],
    ...GI_ASSETS_GRAPHSCOPE,
  },
];

export interface Package {
  name: string;
  url: string;
  global: string;
}

export const setDefaultAssetPackages = () => {
  const packages = JSON.parse(localStorage.getItem('GI_ASSETS_PACKAGES') || '{}');

  /** 保持内置的组件都是最新版本 */
  [...OFFICIAL_PACKAGES, ...BIZ_PACKAGES].forEach(pkg => {
    packages[pkg.global] = {
      ...pkg,
    };
  });

  localStorage.setItem('GI_ASSETS_PACKAGES', JSON.stringify(packages));
};

export const getAssetPackages = () => {
  const packages = JSON.parse(localStorage.getItem('GI_ASSETS_PACKAGES') || '{}');
  return Object.values(packages) as Package[];
};

const loadCss = options => {
  const link = document.createElement('link');
  link.type = 'text/css';
  link.href = options.id || options.url;
  if (options.url) {
    const href = options.url.replace('min.js', 'css');
    link.href = href;
  }
  link.rel = 'stylesheet';
  document.head.append(link);
};

const loadJS = options => {
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.type = options.type || 'text/javascript';
    script.async = !!options.async;
    script.id = options.id || options.url;
    if (options.url) {
      script.src = options.url;
    }
    if (options.text) {
      script.text = options.text;
    }
    document.body.append(script);
    script.onload = () => {
      resolve(script);
    };
    script.onerror = () => {
      resolve(script);
    };
  });
};

export const loader = options => {
  // const queries

  return Promise.all([
    //js
    ...options.map(opt => {
      const asset = window[opt.global];
      if (asset) {
        return { ...asset, ...opt };
      }
      return loadJS(opt).then(_res => {
        let assets = window[opt.global];

        if (!assets) {
          console.warn(`${opt.global} is not found`);
          return undefined;
        }
        if (assets.hasOwnProperty('default')) {
          //临时处理，后面要形成资产打包规范
          //@ts-ignore
          assets = assets.default;
        }
        return { ...assets, ...opt };
      });
    }),
    //css
    ...options.map(opt => {
      if (window[opt.global]) {
        return undefined;
      }
      return loadCss(opt);
    }),
  ]).then(res => {
    return res.filter(c => {
      return c;
    });
  });
};

export const getAssets = async () => {
  if (isDev) {
    return new Promise(resolve => {
      resolve(LOCAL_ASSETS);
    });
  }

  const packages = getAssetPackages();
  return loader(packages).then(res => {
    return res;
  });
};

const appendInfo = (itemAssets, version, name) => {
  if (!itemAssets) {
    return {};
  }
  const coms = Object.keys(itemAssets).reduce((a, c) => {
    return {
      ...a,
      [c]: {
        ...itemAssets[c],
        version,
        pkg: name,
      },
    };
  }, {});
  return coms;
};

/**
 * 获取融合后的资产
 * @returns
 */
export const getCombinedAssets = async () => {
  const assets = await getAssets();
  //@ts-ignore
  return assets.reduce(
    (acc, curr) => {
      const { components, version, name, elements, layouts, services } = curr;
      const coms = appendInfo(components, version, name);
      const elems = appendInfo(elements, version, name);
      const lays = appendInfo(layouts, version, name);

      return {
        components: {
          ...acc.components,
          ...coms,
        },
        elements: {
          ...acc.elements,
          ...elems,
        },
        layouts: {
          ...acc.layouts,
          ...lays,
        },
        services: services
          ? [
              ...acc.services,
              {
                version,
                pkg: name,
                ...services,
              },
            ]
          : acc.services,
      };
    },
    {
      components: {},
      elements: {},
      layouts: {},
      services: [],
    },
  );
};

type AssetsKey = 'components' | 'elements' | 'layouts';
type AssetsValue = {
  [id: string]: {
    registerMeta: () => void;
    info: {
      id: string;
    };
    component: React.FunctionComponent | any;
  };
};

export type IAssets = Record<AssetsKey, AssetsValue>;
