import { utils } from '@antv/gi-sdk';
import functions from './functions.json';
import procedures from './procedures.json';

export const defaultCodeMirrorSettings = {
  value: utils.searchParamOf('cypher') || `MATCH (n) RETURN n limit 10`,
  mode: 'application/x-cypher-query',
  indentWithTabs: true,
  smartIndent: false,
  lineNumbers: true,
  matchBrackets: true,
  autofocus: true,
  theme: 'cypher cypher-dark',
  lint: true,
  styleActiveLine: true,
  extraKeys: { 'Ctrl-Space': 'autocomplete' },
  hintOptions: {
    completeSingle: false,
    closeOnUnfocus: false,
    alignWithWord: true,
    async: true,
  },
  gutters: ['cypher-hints'],
  lineWrapping: true,
  autoCloseBrackets: {
    explode: '',
  },
};

export const defaultCypherSchema = {
  consoleCommands: [
    { name: ':clear' },
    { name: ':play' },
    { name: ':help', description: 'this is help command' },
    {
      name: ':server',
      commands: [
        {
          name: 'user',
          commands: [{ name: 'list', description: 'listdesc' }, { name: 'add' }],
        },
      ],
    },
    { name: ':schema' },
    { name: ':history' },
    { name: ':queries' },
  ],
  labels: [
    ':Spacey mc spaceface',
    ':Legislator',
    ':State',
    ':Party',
    ':Body',
    ':Bill',
    ':Subject',
    ':Committee',
    ':Congress',
  ],
  relationshipTypes: [
    ':REPRESENTS',
    ':IS_MEMBER_OF',
    ':ELECTED_TO',
    ':PROPOSED_DURING',
    ':SPONSORED_BY',
    ':VOTED ON',
    ':REFERRED_TO',
    ':SERVES_ON',
    ':DEALS_WITH',
  ],
  parameters: ['age', 'name', 'surname'],
  propertyKeys: [
    'bioguideID',
    'code',
    'name',
    'type',
    'billID',
    'title',
    'thomasID',
    'birthday',
    'wikipediaID',
    'currentParty',
    'state',
    'votesmartID',
    'fecIDs',
    'republicanCount',
    'otherCount',
    'cspanID',
    'democratCount',
    'lastName',
    'firstName',
    'party',
    'opensecretsID',
    'icpsrID',
    'religion',
    'lisID',
    'govtrackID',
    'gender',
    'district',
    'number',
    'enacted',
    'officialTitle',
    'vetoed',
    'active',
    'popularTitle',
    'cosponsor',
    'vote',
    'jurisdiction',
    'url',
    'rank',
    'washpostID',
  ],
  functions: functions.data.map(data => {
    const name = data.row[0] as string;
    const row1 = data.row[1] as string;
    return {
      name: data.row[0],
      signature: row1.replace(name, ''),
    };
  }),
  procedures: procedures.data.map(data => {
    const name = data.row[0] as string;
    const row1 = data.row[1] as string;
    const signature = row1.replace(name, '');

    let returnItems: { name: string; signature: string }[] = [];
    const matches = signature.match(/\([^)]*\) :: \((.*)\)/i);

    if (matches) {
      returnItems = matches[1].split(', ').map(returnItem => {
        const returnItemMatches = returnItem.match(/(.*) :: (.*)/)!;
        return {
          name: returnItemMatches[1],
          signature: returnItemMatches[2],
        };
      });
    }

    return {
      name,
      signature,
      returnItems,
    };
  }),
};
