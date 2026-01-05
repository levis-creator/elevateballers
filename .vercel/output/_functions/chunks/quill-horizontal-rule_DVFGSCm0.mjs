import Quill from 'quill';

const BlockEmbed = Quill.import("blots/block/embed");
class HorizontalRule extends BlockEmbed {
  static blotName = "horizontal-rule";
  static tagName = "hr";
  static className = "ql-horizontal-rule";
  static create() {
    const node = super.create();
    node.setAttribute("style", "margin: 2rem 0; border: none; border-top: 2px solid #e2e8f0;");
    return node;
  }
  static value() {
    return {};
  }
}
class HorizontalRuleHandler {
  quill;
  constructor(quill) {
    this.quill = quill;
    this.attach();
  }
  attach() {
    this.quill.getModule("toolbar").addHandler("horizontal-rule", this.insertHorizontalRule.bind(this));
  }
  insertHorizontalRule() {
    const range = this.quill.getSelection(true);
    this.quill.insertEmbed(range.index, "horizontal-rule", {}, "user");
    this.quill.setSelection(range.index + 1);
  }
}
Quill.register(HorizontalRule, true);

export { HorizontalRule, HorizontalRuleHandler };
