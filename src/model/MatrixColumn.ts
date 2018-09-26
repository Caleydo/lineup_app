import {NumbersColumn, INumbersColumnDesc, ICategory, createNestedDesc, IDataProvider, NestedColumn, Column, toolbar} from 'lineupjs';

export interface IStratification {
  /**
   * Stratification name
   */
  name: string;
  /**
   * Name or ICategory array
   */
  categories: (ICategory | string)[];
  /**
   * Range of the column indices per group
   * Each item contains an array with the range (start and end index) for the column array
   */
  colIndexRange: number[][];
}

export interface IMatrixColumnDesc extends INumbersColumnDesc {
  stratifications: IStratification[];
}

@toolbar('splitMatrix')
export default class MatrixColumn extends NumbersColumn {
  constructor(id: string, desc: Readonly<IMatrixColumnDesc>) {
    super(id, desc);
  }

  getStratifications() {
    return (<IMatrixColumnDesc>this.desc).stratifications;
  }

  splitBy(stratification: IStratification, provider: IDataProvider) {
    const base = <NestedColumn>provider.create(createNestedDesc(`${this.label} by ${stratification.name}`));
    const w = this.getWidth();
    const totalLength = stratification.colIndexRange.reduce((a, s) => a + (s[1] - s[0]), 0);

    stratification.categories.forEach((group, i: number) => {
      const g = typeof group === 'string' ? { name: group, label: group, color: undefined } : group;
      const gcol = <MatrixColumn>provider.clone(this);
      // set group name
      gcol.setMetaData({ label: g.label || g.name, color: g.color || Column.DEFAULT_COLOR, description: '' });

      const startIndex = stratification.colIndexRange[i][0];
      const endIndex = stratification.colIndexRange[i][1];
      const length = endIndex - startIndex;

      gcol.setSplicer({
        length,
        splice: (vs: any[]) => vs.slice(startIndex, endIndex)
      });
      gcol.setWidth(w * length / totalLength);

      base.push(gcol);
    });

    // replace with splitted value
    this.insertAfterMe(base);
    this.removeMe();
  }
}
