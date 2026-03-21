/**
 * Quill Horizontal Rule Module
 * Adds horizontal line/divider support (WordPress-like)
 */

import Quill from 'quill';

const BlockEmbed = Quill.import('blots/block/embed');

/**
 * Horizontal Rule Blot
 */
class HorizontalRule extends BlockEmbed {
  static blotName = 'horizontal-rule';
  static tagName = 'hr';
  static className = 'ql-horizontal-rule';

  static create() {
    const node = super.create();
    node.setAttribute('style', 'margin: 2rem 0; border: none; border-top: 2px solid #e2e8f0;');
    return node;
  }

  static value() {
    return {};
  }
}

/**
 * Horizontal Rule Handler
 */
class HorizontalRuleHandler {
  quill: any;

  constructor(quill: any) {
    this.quill = quill;
    this.attach();
  }

  attach() {
    this.quill.getModule('toolbar').addHandler('horizontal-rule', this.insertHorizontalRule.bind(this));
  }

  insertHorizontalRule() {
    const range = this.quill.getSelection(true);
    this.quill.insertEmbed(range.index, 'horizontal-rule', {}, 'user');
    this.quill.setSelection(range.index + 1);
  }
}

// Register the horizontal rule blot
Quill.register(HorizontalRule, true);

export { HorizontalRule, HorizontalRuleHandler };

