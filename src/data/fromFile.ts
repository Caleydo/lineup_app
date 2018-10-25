
import {parse, ParseResult} from 'papaparse';
import {IDataset} from './IDataset';
import {builder} from 'lineupjs';
import {canRender} from './utils';

export default function fromFile(file: File): Promise<IDataset> {
  if (file.name.endsWith('.json') || file.type === 'application/json') {
    return fromJSONFile(file);
  }
  if (file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.name.endsWith('.txt') || file.type === 'text/csv') {
    return fromCSVFile(file);
  }
  return Promise.reject(`unknown file type: ${file.name}`);
}

function fromCSVFile(file: File): Promise<IDataset> {
  return new Promise<{raw: string, parsed: ParseResult}>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result);
      const parsed = parse(raw, {
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true
      });
      resolve({raw, parsed});
    };
    reader.readAsText(file);
  }).then(({raw, parsed}) => {
    const title = file.name.split('.').slice(0, -1).join('.');
    return {
      id: title.toLowerCase().replace(/\s+/g, '-'),
      title,
      description: `Imported from "${file.name}" on ${new Date()}`,
      rawData: raw,
      buildScript: (rawVariable: string, domVariable: string) => {
        return `
        const parsed = Papa.parse(${rawVariable}, {
          dynamicTyping: true,
          header: true,
          skipEmptyLines: true
        });

        const lineup = LineUpJS.asLineUp(${domVariable}, parsed.data, ...parsed.meta.fields);
        `;
      },
      build: (node: HTMLElement) => {
        return builder(parsed.data)
          .canRender(canRender)
          .deriveColumns(...parsed.meta.fields)
          .deriveColors()
          .defaultRanking()
          .buildTaggle(node);
      }
    };
  });
}


function fromJSONFile(file: File): Promise<IDataset> {
  return new Promise<{raw: string, parsed: object[]}>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result);
      const parsed = JSON.parse(raw);
      resolve({raw, parsed});
    };
    reader.readAsText(file);
  }).then(({raw, parsed}) => {
    const title = file.name.split('.').slice(0, -1).join('.');
    return {
      id: title.toLowerCase().replace(/\s+/g, '-'),
      title,
      description: `Imported from "${file.name}" on ${new Date()}`,
      rawData: raw,
      buildScript: (rawVariable: string, domVariable: string) => {
        return `
        const parsed = JSON.parse(${rawVariable});

        const lineup = LineUpJS.asLineUp(${domVariable}, parsed);
        `;
      },
      build: (node: HTMLElement) => {
        return builder(parsed)
          .deriveColumns()
          .deriveColors()
          .defaultRanking()
          .buildTaggle(node);
      }
    };
  });
}
