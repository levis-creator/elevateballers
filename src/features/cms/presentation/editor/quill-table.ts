/**
 * Quill Table Module
 * Adds table support to the editor (WordPress-like)
 */

import Quill from 'quill';

const Block = Quill.import('blots/block');
const Container = Quill.import('blots/container');

/**
 * Table Row Blot
 */
class TableRow extends Container {
  static blotName = 'table-row';
  static tagName = 'tr';
}

/**
 * Table Cell Blot
 */
class TableCell extends Block {
  static blotName = 'table-cell';
  static tagName = 'td';
  
  static create(value: any) {
    const node = super.create();
    if (value && value.align) {
      node.setAttribute('style', `text-align: ${value.align}`);
    }
    return node;
  }
}

/**
 * Table Module - Handles table insertion and editing
 */
class TableModule {
  quill: any;
  options: any;

  constructor(quill: any, options: any) {
    this.quill = quill;
    this.options = options;
    this.attach();
  }

  attach() {
    this.quill.getModule('toolbar').addHandler('table', this.insertTable.bind(this));
  }

  insertTable() {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    
    if (!rows || !cols) return;

    const numRows = parseInt(rows);
    const numCols = parseInt(cols);

    if (isNaN(numRows) || isNaN(numCols) || numRows < 1 || numCols < 1) {
      alert('Please enter valid numbers for rows and columns.');
      return;
    }

    const range = this.quill.getSelection(true);
    const table = document.createElement('table');
    table.className = 'ql-table';
    table.style.cssText = 'width: 100%; border-collapse: collapse; margin: 1rem 0;';

    for (let i = 0; i < numRows; i++) {
      const tr = document.createElement('tr');
      for (let j = 0; j < numCols; j++) {
        const td = document.createElement('td');
        td.style.cssText = 'border: 1px solid #ddd; padding: 8px;';
        td.innerHTML = '<p><br></p>';
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    this.quill.clipboard.dangerouslyPasteHTML(range.index, table.outerHTML, 'user');
    this.quill.setSelection(range.index + 1);
  }
}

// Register table blots
Quill.register(TableRow, true);
Quill.register(TableCell, true);

export { TableModule, TableRow, TableCell };

