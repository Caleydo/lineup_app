import {builder, deriveColors, LocalDataProvider, Taggle} from 'lineupjs';
import {IDataset, PRELOADED_TYPE} from '../IDataset';
import image from './simple.png';


export const simple: IDataset = {
  id: 'simple',
  type: PRELOADED_TYPE,
  creationDate: new Date(),
  name: 'Simple Random Dataset',
  image,
  description: `A random dataset to illustrate LineUp features`,
  rawData: '',
  buildScript(_rawVariable: string, domVariable: string, dumpVariable: string) {
    return `
// generate some data
const arr = [];
const cats = ['c1', 'c2', 'c3'];
for (let i = 0; i < 100; ++i) {
  arr.push({
    d: 'Row ' + i,
    a: Math.random() * 10,
    cat: cats[Math.floor(Math.random() * 3)],
    cat2: cats[Math.floor(Math.random() * 3)]
  });
}

const lineup = LineUpJS.builder(arr)
  .deriveColumns()
  .deriveColors()
  .aggregationStrategy('group+top+item')
  .restore(${dumpVariable})
  .build(${domVariable});
  `;
  },
  build(node: HTMLElement) {
    // generate some data
    const arr = [];
    const cats = ['c1', 'c2', 'c3'];
    for (let i = 0; i < 100; ++i) {
      arr.push({
        d: `Row ${i}`,
        a: Math.random() * 10,
        cat: cats[Math.floor(Math.random() * 3)],
        cat2: cats[Math.floor(Math.random() * 3)]
      });
    }

    return builder(arr)
      .deriveColumns()
      .deriveColors()
      .aggregationStrategy('group+top+item')
      .build(node);
  }
};

/**
 * Format number (e.g., 1,000,000 as 1M)
 * @param num Number to format
 * @returns Formatted number as string
 */
function nFormatter(num: number) {
  if (num >= 1000000000) {
     return `${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}G`;
  }
  if (num >= 1000000) {
     return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1000) {
     return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${num}`;
}

function generateBig(numRows: number, animated: boolean) {
  const formatedNumRows = nFormatter(numRows);

  return {
    id: `random-${formatedNumRows}`,
    type: PRELOADED_TYPE,
    creationDate: new Date(),
    name: `${formatedNumRows} Random Dataset`,
    image,
    description: `A random dataset to illustrate LineUp scalability with ${formatedNumRows} rows`,
    rawData: '',
    buildScript(_rawVariable: string, domVariable: string, dumpVariable: string) {
      return `
// generate some data
const arr = [];
const cats = ['c1', 'c2', 'c3'];
const cat2 = ['a1', 'a2'];
for (let i = 0; i < ${numRows}; ++i) {
  arr.push({
    label: 'Row ' + i,
    number: Math.random() * 10,
    number2: Math.random() * 10,
    cat: cats[Math.floor(Math.random() * cats.length)],
    cat2: cat2[Math.floor(Math.random() * cat2.length)]
  });
}
console.log('generated');
const desc = [{
    label: 'Label',
    type: 'string',
    column: 'label'
  },
  {
    label: 'Number',
    type: 'number',
    column: 'number',
    domain: [0, 10]
  },
  {
  label: 'Number2',
  type: 'number',
  column: 'number2',
  domain: [0, 10]
  },
  {
    label: 'Cat',
    type: 'categorical',
    column: 'cat',
    categories: ['c1', 'c2', 'c3']
  },
  {
    label: 'Cat2',
    type: 'categorical',
    column: 'cat2',
    categories: [{
      name: 'a1',
      label: 'A1',
      color: 'green'
    }, {
      name: 'a2',
      label: 'A2',
      color: 'blue'
    }]
  },
];
LineUpJS.deriveColors(desc);

const p = new LineUpJS.LocalDataProvider(arr, desc, {
  taskExecutor: 'scheduled'
});
p.restore(${dumpVariable});

const lineup = new LineUpJS.Taggle(${domVariable}, p, {
  animated: ${animated}
});
lineup.update();
  `;
    },
    build(node: HTMLElement) {
      const arr = [];
      const cats = ['c1', 'c2', 'c3'];
      const cat2 = ['a1', 'a2'];
      for (let i = 0; i < numRows; ++i) {
        arr.push({
          label: `Row ${i}`,
          number: Math.random() * 10,
          number2: Math.random() * 10,
          cat: cats[Math.floor(Math.random() * cats.length)],
          cat2: cat2[Math.floor(Math.random() * cat2.length)]
        });
      }
      console.log('generated');
      const desc = [{
        label: 'Label',
        type: 'string',
        column: 'label'
      },
      {
        label: 'Number',
        type: 'number',
        column: 'number',
        domain: [0, 10]
      },
      {
        label: 'Number2',
        type: 'number',
        column: 'number2',
        domain: [0, 10]
      },
      {
        label: 'Cat',
        type: 'categorical',
        column: 'cat',
        categories: ['c1', 'c2', 'c3']
      },
      {
        label: 'Cat2',
        type: 'categorical',
        column: 'cat2',
        categories: [{
          name: 'a1',
          label: 'A1',
          color: 'green'
        }, {
          name: 'a2',
          label: 'A2',
          color: 'blue'
        }]
      },
      ];
      deriveColors(desc);

      const p = new LocalDataProvider(arr, desc, {
        taskExecutor: 'scheduled'
      });
      p.deriveDefault();

      const instance = new Taggle(node, p, {
        animated
      });
      instance.update();
      return instance;
    }
  };
}

export const big = [
  generateBig(100, false),
  generateBig(1000, false),
  generateBig(10000, false),
  generateBig(100000, false),
  generateBig(1000000, false),
];
