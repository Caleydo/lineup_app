import {CategoricalColumn, ICellRendererFactory, ERenderMode, Column, NumberColumn, StringColumn} from 'lineupjs';
import {MatrixColumn} from '../model';

/**
 * Check which renderer should be available and which one should be disabled.
 * The function is implemented as black list. Add the renderer type that should be hidden for certain columns.
 * @param type renderer type (see `renderers` in `lineupjs/src/renderer/index.ts`)
 * @param _renderer the renderer class itself
 * @param col the column
 * @param mode the renderer mode
 */
export function canRender(type: string, _renderer: ICellRendererFactory, col: Column, mode: ERenderMode): boolean {
  if(col instanceof CategoricalColumn) {
    switch(mode) {
      case ERenderMode.CELL:
        return !(type === 'table' || type === 'catheatmap');

      case ERenderMode.GROUP:
        return !(type === 'table' || type === 'catheatmap' || type === 'default');

      case ERenderMode.SUMMARY:
        return !(type === 'table');
    }

  } else if(col instanceof NumberColumn) {
    switch(mode) {
      case ERenderMode.GROUP:
        return !(type === 'default');

      case ERenderMode.SUMMARY:
        return !(type === 'default');
    }

  } else if(col instanceof StringColumn) {
    switch(mode) {
      case ERenderMode.CELL:
        return !(type === 'default' || type === 'image' || type === 'link');

      case ERenderMode.GROUP:
        return !(type === 'default' || type === 'link');

      case ERenderMode.SUMMARY:
        return !(type === 'default');
    }

  } else if(col instanceof MatrixColumn) {
    switch(mode) {
      case ERenderMode.CELL:
        return !(type === 'mapbars' || type === 'verticalbar' || type === 'histogram' || type === 'table');

      case ERenderMode.GROUP:
        return !(type === 'default' || type === 'table');

      case ERenderMode.SUMMARY:
        return !(type === 'mapbars' || type === 'heatmap' || type === 'table');
    }
  }

  return true;
}
