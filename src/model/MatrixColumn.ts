import { NumbersColumn, INumbersColumnDesc, ICategory, createNestedDesc, IDataProvider, NestedColumn, toolbar, IDataRow, ITypeFactory } from 'lineupjs';

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
export class MatrixColumn extends NumbersColumn {
  constructor(id: string, desc: Readonly<IMatrixColumnDesc>, factory: ITypeFactory) {
    super(id, desc, factory);
  }

  getStratifications() {
    return (<IMatrixColumnDesc>this.desc).stratifications;
  }

  splitBy(stratification: IStratification, provider: IDataProvider) {
    const nestedDesc = createNestedDesc(`${this.label} by ${stratification.name}`);
    const base = <NestedColumn>provider.create(nestedDesc);
    const totalWidth = this.getWidth();
    const totalLength = stratification.colIndexRange.reduce((a, s) => a + (s[1] - s[0]), 0);

    stratification.categories.forEach((group, i: number) => {
      const g = typeof group === 'string' ? {name: group, label: group} : group;

      const startIndex = stratification.colIndexRange[i][0];
      const endIndex = stratification.colIndexRange[i][1];
      const length = endIndex - startIndex;
      const width = totalWidth * length / totalLength;

      const groupDesc = Object.assign({}, this.desc, {
        label: g.label || g.name,
        dataLength: length,
        accessor: (row: IDataRow, desc: any) => row.v[desc.column].slice(startIndex, endIndex),
        width
      });
      const gcol = <MatrixColumn>provider.create(groupDesc);
      gcol.setWidth(width);
      base.push(gcol);
    });

    // replace with splitted value
    this.insertAfterMe(base);
    this.removeMe();
  }
}
