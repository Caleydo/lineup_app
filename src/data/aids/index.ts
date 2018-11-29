import { PRELOADED_TYPE } from './../IDataset';
import {IDataset} from '../IDataset';
import {parse, ParseResult} from 'papaparse';
import {builder, buildRanking, buildStringColumn, buildCategoricalColumn, buildNumberColumn, ICategory} from 'lineupjs';
import image from './aids.png';
import {splitMatrix, MatrixColumn, IStratification} from '../../model';
import {columns as rawColumns} from './AIDS_Countries.json';
import {canRender} from '../utils';

function getCategories(column: string): ICategory[] {
  return rawColumns.filter((d: any) => d.column === column)[0].categories;
}

function stratifications(): IStratification[] {
  return [
    {
      name: 'decades',
      categories: ['1990s', '2000s', '2010s'],
      colIndexRange: [[0, 10], [10, 20], [20, 26]]
    }
  ];
}

export const data: IDataset = {
  id: 'aids',
  type: PRELOADED_TYPE,
  creationDate: new Date(),
  name: 'AIDS',
  image,
  link: '',
  description: `<p></p>`,
  rawData: '',
  buildScript(rawVariable: string, domVariable: string, dumpVariable: string) {
    return `
// NOTE: This code will only build LineUp with the base table and exclude the matrix columns

const parsed = Papa.parse(${rawVariable}, {
  dynamicTyping: true,
  header: true,
  skipEmptyLines: true
});

const dump = ${dumpVariable};

const lineup = LineUpJS.builder(parsed.data)
  .column(LineUpJS.buildStringColumn('country').label('Country'))
  .column(LineUpJS.buildNumberColumn('sex_before_15').label('Sex before 15 (15-24, %, 2015)'))
  .column(LineUpJS.buildNumberColumn('condom_use').label('Condom use at last sex (%, 2015)'))
  .column(LineUpJS.buildNumberColumn('ppl_art_absolute').label('# ppl. on ART (2015)'))
  .column(LineUpJS.buildNumberColumn('ppl_art_relative').label('% ppl. on ART ( 2015)'))
  .column(LineUpJS.buildNumberColumn('knowing_have_hiv').label('Ppl knowing they have HIV (%, 2015)'))
  .column(LineUpJS.buildNumberColumn('hiv_prevention_knowledge').label('HIV prevention knowledge (age 15-24, %, 2015)'))
  .column(LineUpJS.buildNumberColumn('discriminatory_attitute_perc').label('Discriminatory attitude (%)'))
  .column(LineUpJS.buildCategoricalColumn('discriminatory_attitute_scale').label('Discriminatory attitude scale'))
  .column(LineUpJS.buildCategoricalColumn('human_development_index').label('Human development index'))
  .column(LineUpJS.buildCategoricalColumn('continent').label('Continent'))
  .column(LineUpJS.buildCategoricalColumn('hiv_restrictions').label('HIV restrictions on entry, stay, or residence'))
  .column(LineUpJS.buildNumberColumn('population').label('Population (2017)'))
  .column(LineUpJS.buildNumberColumn('yearly_change').label('Yearly change (%)'))
  .column(LineUpJS.buildNumberColumn('net_change').label('Net change'))
  .column(LineUpJS.buildNumberColumn('density').label('Density (P/SqKm)'))
  .column(LineUpJS.buildNumberColumn('land_area').label('Land Area (SqKm)'))
  .column(LineUpJS.buildNumberColumn('migrants').label('Migrants (net)'))
  .column(LineUpJS.buildNumberColumn('fertility_rate').label('Fertility Rate'))
  .column(LineUpJS.buildNumberColumn('median_age').label('Median Age'))
  .column(LineUpJS.buildNumberColumn('urban_population').label('Urban Population (%)'))
  .column(LineUpJS.buildNumberColumn('world_share').label('World Share (%)'))
  .deriveColors()
  .ranking(LineUpJS.buildRanking()
    .aggregate()
    .group()
    .rank()
    .selection()
    .column('country')
    .column('continent')
    .column('knowing_have_hiv')
    .column('discriminatory_attitute_scale')
    .column('urban_population')
    //.allColumns()
  )
  .restore(dump)
  .buildTaggle(${domVariable});
`;
  },
  build(node: HTMLElement) {
    const countriesTable = import('raw-loader!./AIDS_Countries.csv');
    // based on AIDS_Countries.csv
    const countryMatrixTables = [
      {column: 'living_hiv', import: import('raw-loader!./AIDS_living_HIV.csv')},
      {column: 'living_hiv_normalized', import: import('raw-loader!./AIDS_living_HIV_normalized.csv')},
      {column: 'new_hiv_infections', import: import('raw-loader!./AIDS_new_HIV_infections.csv')},
      {column: 'new_hiv_infections_normalized', import: import('raw-loader!./AIDS_new_HIV_infections_normalized.csv')},
      {column: 'orphans', import: import('raw-loader!./AIDS_orphans.csv')},
      {column: 'orphans_normalized', import: import('raw-loader!./AIDS_orphans_normalized.csv')},
      {column: 'related_deaths', import: import('raw-loader!./AIDS_related_deaths.csv')},
      {column: 'related_deaths_normalized', import: import('raw-loader!./AIDS_related_deaths_normalized.csv')},
    ];

    // const yearsTable = import('raw-loader!./AIDS_Years.csv');
    // based on AIDS_Years.csv
    // const yearMatrixTables = [
    //   { column: 'on_art', import: import('raw-loader!./AIDS_on_ART.csv') },
    //   { column: 'on_art_normalized', import: import('raw-loader!./AIDS_on_ART_normalized.csv') },
    // ];

    const files = [
      countriesTable,
      ...countryMatrixTables.map((d) => d.import)
    ];

    return Promise.all(files)
      .then((data: any[]) => {
        return data.map((content, index) => {
          const csv: string = content.default ? content.default : content;
          // TODO find a way how to store the matrix tables
          if (index === 0) {
            this.rawData = csv;
          }
          return parse(csv, {
            dynamicTyping: true,
            header: true,
            skipEmptyLines: true
          });
        });
      })
      .then((parsedData: ParseResult[]) => {

        const mainTable: ParseResult = parsedData[0];
        const matrixResults: ParseResult[] = parsedData.slice(1);

        const matrixRows: any[] = [];
        countryMatrixTables.map((d, colIndex) => {
          const colName = d.column;
          matrixResults[colIndex].data.forEach((row, rowIndex) => {
            matrixRows[rowIndex] = {
              ...matrixRows[rowIndex],
              [colName]: Object.values(row).filter((d) => d !== row['Country x Year'])
            };
          });
        });

        const rows = mainTable.data.map((row, rowIndex) => {
          return {
            ...row,
            ...matrixRows[rowIndex]
          };
        });

        const strats = stratifications();

        return builder(rows)
          .canRender(canRender)
          .registerColumnType('matrix', MatrixColumn)
          .registerToolbarAction('splitMatrix', splitMatrix)
          .column(buildStringColumn('country').label('Country'))
          .column(buildNumberColumn('sex_before_15').label('Sex before 15 (15-24, %, 2015)'))
          .column(buildNumberColumn('condom_use').label('Condom use at last sex (%, 2015)'))
          .column(buildNumberColumn('ppl_art_absolute').label('# ppl. on ART (2015)'))
          .column(buildNumberColumn('ppl_art_relative').label('% ppl. on ART ( 2015)'))
          .column(buildNumberColumn('knowing_have_hiv').label('Ppl knowing they have HIV (%, 2015)'))
          .column(buildNumberColumn('hiv_prevention_knowledge').label('HIV prevention knowledge (age 15-24, %, 2015)'))
          .column(buildNumberColumn('discriminatory_attitute_perc').label('Discriminatory attitude (%)'))
          .column(buildCategoricalColumn('discriminatory_attitute_scale').label('Discriminatory attitude scale').categories(getCategories('discriminatory_attitute_scale')))
          .column(buildCategoricalColumn('human_development_index').label('Human development index').categories(getCategories('human_development_index')))
          .column(buildCategoricalColumn('continent').label('Continent').categories(getCategories('continent')))
          .column(buildCategoricalColumn('hiv_restrictions').label('HIV restrictions on entry, stay, or residence').categories(getCategories('hiv_restrictions')))
          .column(buildNumberColumn('population').label('Population (2017)'))
          .column(buildNumberColumn('yearly_change').label('Yearly change (%)'))
          .column(buildNumberColumn('net_change').label('Net change'))
          .column(buildNumberColumn('density').label('Density (P/SqKm)'))
          .column(buildNumberColumn('land_area').label('Land Area (SqKm)'))
          .column(buildNumberColumn('migrants').label('Migrants (net)'))
          .column(buildNumberColumn('fertility_rate').label('Fertility Rate'))
          .column(buildNumberColumn('median_age').label('Median Age'))
          .column(buildNumberColumn('urban_population').label('Urban Population (%)'))
          .column(buildNumberColumn('world_share').label('World Share (%)'))

          // matrix columns
          .column(buildNumberColumn('living_hiv', [100.0, 7000000.0]).label('N. ppl. living with HIV').asArray(26).width(300).custom('type', 'matrix').custom('stratifications', strats))
          .column(buildNumberColumn('living_hiv_normalized', [0.0, 166.6217293]).label('N. ppl. living with HIV per 1000 ppl').asArray(26).width(300).custom('type', 'matrix').custom('stratifications', strats))

          .column(buildNumberColumn('new_hiv_infections', [100.0, 850000.0]).label('N. new HIV infections').asArray(26).width(300).custom('type', 'matrix').custom('stratifications', strats))
          .column(buildNumberColumn('new_hiv_infections_normalized', [0.0, 15.33289704]).label('N. new HIV infections per 1000 ppl').asArray(26).width(300).custom('type', 'matrix').custom('stratifications', strats))

          .column(buildNumberColumn('related_deaths', [100.0, 410000.0]).label('AIDS related deaths').asArray(26).width(300).custom('type', 'matrix').custom('stratifications', strats))
          .column(buildNumberColumn('related_deaths_normalized', [0.0, 7.395867983]).label('AIDS related deaths per 1000 ppl').asArray(26).width(300).custom('type', 'matrix').custom('stratifications', strats))

          .column(buildNumberColumn('orphans', [100.0, 2200000.0]).label('AIDS orphans').asArray(26).width(300).custom('type', 'matrix').custom('stratifications', strats))
          .column(buildNumberColumn('orphans_normalized', [0.0, 47.13008393]).label('AIDS orphans per 1000 ppl').asArray(26).width(300).custom('type', 'matrix').custom('stratifications', strats))

          .deriveColors()
          .ranking(buildRanking()
            .aggregate()
            .group()
            .rank()
            .selection()
            .column('country')
            .column('continent')
            .column('knowing_have_hiv')
            .column('new_hiv_infections_normalized')
            .column('related_deaths_normalized')
            .column('discriminatory_attitute_scale')
            .column('urban_population')
            .sortBy('country', 'asc')
          )
          .buildTaggle(node);
      });
  }
};

export default data;
