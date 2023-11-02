import { getDriver } from './Neo4jService';
import $i18n from '../i18n';
export const NeighborsQuery = {
  name: $i18n.get({ id: 'neo4j.src.services.NeighborsQuery.NeighborQuery', dm: '邻居查询' }),
  service: async params => {
    const { ids, code } = params;
    const driver = await getDriver();
    if (driver) {
      const res = await driver.getKDegreeRelationships(ids, code);
      return res;
    }
  },
};
