import {IDataset} from '../IDataset';
import {parse, ParseResult} from 'papaparse';
import {builder, buildRanking, buildStringColumn, buildCategoricalColumn, buildNumberColumn} from 'lineupjs';
import '!file-loader?name=preview.png!./soccer.png';

export const data: IDataset = {
  id: 'ordino1',
  title: 'Ordino 1',
  image: './preview.png',
  link: '',
  description: `<p></p>`,
  rawData: '',
  buildScript(rawVariable: string, domVariable: string) {
    return `
  const parsed = Papa.parse(${rawVariable}, {
    dynamicTyping: true,
    header: true,
    skipEmptyLines: true
  });

  //parsed.data.forEach((row) => {
  //  const suffix = [12, 13, 14, 15, 16, 17];
  //  const cols = ['games', 'goals', 'minutes', 'assists'];
  //  cols.forEach((col) => {
  //    row[col] = suffix.map((d) => !row[col + d] && row[col + d] !== 0 ? null : row[col + d]);
  //  });
  //});

  const lineup = LineUpJS.builder(parsed.data)//
    .column(buildStringColumn('Symbol'))
    .column(buildStringColumn('Ensembl'))
    .column(buildStringColumn('Name'))
    .column(buildNumberColumn('Chromosome', [0, NaN]))
    .column(buildCategoricalColumn('Biotype'))
    .column(buildNumberColumn('Relative Copy Number of 59M', [0, NaN]))
    .column(buildNumberColumn('Total Absolute Copy Number of 59M', [0, NaN]))
    .column(buildNumberColumn('Relative Copy Number of 143B', [0, NaN]))
    .column(buildNumberColumn('Total Absolute Copy Number of 143B', [0, NaN]))
    .column(buildNumberColumn('numbers Relative Copy Number', [0, NaN]).asArray(4))
    .deriveColors()
    .ranking(buildRanking()
      .supportTypes()
      .allColumns()
    )
    .buildTaggle(${domVariable});
  `;
  },
  build(node: HTMLElement) {
    return import('raw-loader!./ordino1.csv').then((content: any) => {
      const csv: string = content.default ? content.default : content;
      this.rawData = csv;
      return parse(csv, {
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true
      });
    }).then((parsed: ParseResult) => {
      parsed.data.forEach((row) => {
        const cols = ['numbers Relative Copy Number'];
        cols.forEach((col) => {
          row[col] = JSON.parse(row[col]);
        });
      });
      return builder(parsed.data)
        .column(buildStringColumn('Symbol'))
        .column(buildStringColumn('Ensembl'))
        .column(buildStringColumn('Name'))
        .column(buildNumberColumn('Chromosome', [0, NaN]))
        .column(buildCategoricalColumn('Biotype'))
        .column(buildNumberColumn('Relative Copy Number of 59M', [0, NaN]))
        .column(buildNumberColumn('Total Absolute Copy Number of 59M', [0, NaN]))
        .column(buildNumberColumn('Relative Copy Number of 143B', [0, NaN]))
        .column(buildNumberColumn('Total Absolute Copy Number of 143B', [0, NaN]))
        .column(buildNumberColumn('numbers Relative Copy Number', [0, NaN]).asArray(4))
        .deriveColors()
        .ranking(buildRanking()
          .supportTypes()
          .allColumns()
        )
        .buildTaggle(node);
    });
  }
};

export default data;
