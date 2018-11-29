import {IDataset, PRELOADED_TYPE} from '../IDataset';
import {parse, ParseResult} from 'papaparse';
import {builder, buildRanking, buildStringColumn, buildCategoricalColumn, buildNumberColumn} from 'lineupjs';
import '!file-loader?name=preview.png!./soccer.png';
import {splitMatrix, MatrixColumn, IStratification} from '../../model';


function stratifications(): IStratification[] {
  const descs = [
    {
      name: 'season',
      value: {
        categories: [
          '12/13',
          '13/14',
          '14/15',
          '15/16',
          '16/17',
          '17/18',
        ]
      }
    }
  ];

  return descs.map((d) => {
    return {
      name: d.name,
      categories: d.value.categories,
      data: d.value.categories
    };
  });
}

export const data: IDataset = {
  id: 'soccer',
  type: PRELOADED_TYPE,
  creationDate: new Date(),
  name: 'Soccer Stats',
  image: './preview.png',
  link: 'https://www.kaggle.com/gimunu/football-striker-performance',
  description: `<p>
  The aim of this dataset is to offer in a relatively small number of columns (~30) data to compare the performance of some football players, or to compare the efficiency of strikers in-between different European leagues.
</p>`,
  rawData: '',
  buildScript(rawVariable: string, domVariable: string, dumpVariable: string) {
    return `
const parsed = Papa.parse(${rawVariable}, {
  dynamicTyping: true,
  header: true,
  skipEmptyLines: true
});
const dump = ${dumpVariable};

parsed.data.forEach((row) => {
  const suffix = [12, 13, 14, 15, 16, 17];
  const cols = ['games', 'goals', 'minutes', 'assists'];
  cols.forEach((col) => {
    row[col] = suffix.map((d) => !row[col + d] && row[col + d] !== 0 ? null : row[col + d]);
  });
});

const lineup = LineUpJS.builder(parsed.data)
  .column(LineUpJS.buildStringColumn('player').width(150))
  .column(LineUpJS.buildNumberColumn('age', [0, NaN]))
  .column(LineUpJS.buildStringColumn('current_club').width(150).label('Current Club'))
  .column(LineUpJS.buildCategoricalColumn('current_league').label('Current League'))
  .column(LineUpJS.buildCategoricalColumn('foot'))
  .column(LineUpJS.buildNumberColumn('height', [160, NaN]))
  .column(LineUpJS.buildStringColumn('nationality'))
  .column(LineUpJS.buildCategoricalColumn('position'))
  .column(LineUpJS.buildNumberColumn('games', [0, NaN]).asArray(6).width(300))
  .column(LineUpJS.buildNumberColumn('goals', [0, NaN]).asArray(6).width(300))
  .column(LineUpJS.buildNumberColumn('minutes', [0, NaN]).asArray(6).width(300)))
  .column(LineUpJS.buildNumberColumn('assists', [0, NaN]).asArray(6).width(300))
  .deriveColors()
  .ranking(LineUpJS.buildRanking()
      .aggregate()
      .group()
      .rank()
      .selection()
      .column('player')
      .column('current_league')
      .column('current_club')
      .column('position')
      .column('foot')
      .column('age')
      .column('height')
      .column('goals')
      .column('games')
      //.allColumns()
  )
  .restore(dump)
  .buildTaggle(${domVariable});
`;
  },
  build(node: HTMLElement) {
    return import('raw-loader!./soccer.csv').then((content: any) => {
      const csv: string = content.default ? content.default : content;
      this.rawData = csv;
      return parse(csv, {
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true
      });
    }).then((parsed: ParseResult) => {
      const suffix = [12, 13, 14, 15, 16, 17];
      const cols = ['games', 'goals', 'minutes', 'assists'];
      const labels = suffix.map((d) => `20${d}`);
      parsed.data.forEach((row) => {
        cols.forEach((col) => {
          row[col] = suffix.map((d) => !row[`${col}${d}`] && row[`${col}${d}`] !== 0 ? null : row[`${col}${d}`]);
        });
      });

      const strats = stratifications();

      return builder(parsed.data)
        .registerColumnType('matrix', MatrixColumn)
        .registerToolbarAction('splitMatrix', splitMatrix)
        .column(buildStringColumn('player').width(150))
        .column(buildNumberColumn('age', [0, NaN]))
        .column(buildStringColumn('current_club').width(150).label('Current Club'))
        .column(buildCategoricalColumn('current_league').label('Current League'))
        .column(buildCategoricalColumn('foot'))
        .column(buildNumberColumn('height', [160, 210]))
        .column(buildStringColumn('nationality'))
        .column(buildCategoricalColumn('position'))
        .column(buildNumberColumn('games', [0, NaN]).asArray(labels).width(300).custom('type', 'matrix').custom('stratifications', strats))
        .column(buildNumberColumn('goals', [0, NaN]).asArray(labels).width(300).custom('type', 'matrix').custom('stratifications', strats))
        .column(buildNumberColumn('minutes', [0, NaN]).asArray(labels).width(300).custom('type', 'matrix').custom('stratifications', strats))
        .column(buildNumberColumn('assists', [0, NaN]).asArray(labels).width(300).custom('type', 'matrix').custom('stratifications', strats))
        .deriveColors()
        .ranking(buildRanking()
          .aggregate()
          .group()
          .rank()
          .selection()
          .column('player')
          .column('current_league')
          .column('current_club')
          .column('position')
          .column('foot')
          .column('age')
          .column('height')
          .column('goals')
          .column('games')
          //.allColumns()
        )
        .buildTaggle(node);
    });
  }
};

export default data;
