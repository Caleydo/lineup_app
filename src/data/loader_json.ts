import {IDataLoader, IDataset, IDatasetMeta} from './IDataset';
import {builder} from 'lineupjs';
import {randomChars} from './ùtils';

function buildScript(rawVariable: string, domVariable: string) {
  return `
  const parsed = JSON.parse(${rawVariable});

  const lineup = LineUpJS.asLineUp(${domVariable}, parsed);
  `;
}

export const JSON_LOADER: IDataLoader = {
  type: 'json',
  supports: (file: File) => file.name.endsWith('.json') || file.type === 'application/json',
  loadFile: (file: File) => {
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
        id: `${title.toLowerCase().replace(/\s+/g, '-')}-${randomChars(3)}`,
        type: <'json'>'json',
        title,
        creationDate: new Date(),
        description: `Imported from "${file.name}" on ${new Date()}`,
        rawData: raw,
        buildScript,
        build: (node: HTMLElement) => {
          return builder(parsed)
            .deriveColumns()
            .deriveColors()
            .defaultRanking()
            .buildTaggle(node);
        }
      };
    });
  },

  complete: (db: IDatasetMeta): IDataset => {
    return <IDataset>Object.assign(db, {
      type: 'json',
      buildScript,
      build: (node: HTMLElement) => {
        const parsed = JSON.parse(db.rawData!);
        return builder(parsed)
            .deriveColumns()
            .deriveColors()
            .defaultRanking()
            .buildTaggle(node);
      }
    });
  }
};

export default JSON_LOADER;
