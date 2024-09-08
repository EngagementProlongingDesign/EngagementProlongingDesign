export class ParentChart {
  constructor(id, data) {
    this.data = data;
    this.div = id;
  }

  add_svg() {
    this.add_margin();
  }

  add_margin() {
    const div = d3.select(`#${this.div}`);
    div.selectAll("*").remove();
    this.getWH(div);
    this.margin = { left: 0, right: 0, top: 0, bottom: 0 };
    this.innerW = this.width - this.margin.left - this.margin.right;
    this.innerH = this.height - this.margin.top - this.margin.bottom;
    this.svg = div
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);
    this.ChartArea = this.svg.append("g");
  }

  add_label({ className, labelText, x, y }) {
    this.ChartArea.selectAll(`.${className}`)
      .data([0])
      .join("text")
      .attr("class", className)
      .attr("transform", `translate(${x},${y})`)
      .text(labelText);
  }
  tips_show(e, v, html) {
    d3.select(".d3-tip")
      .style("display", "block")
      .style("position", "absolute")
      .style("top", e.pageY + "px")
      .style("left", e.pageX + "px")
      .style("padding", "5px")
      .html(html);
  }
  tips_hide() {
    d3.select(".d3-tip").style("display", "none");
  }

  getWH(node) {
    this.width = node.node().getBoundingClientRect().width;
    this.height = node.node().getBoundingClientRect().height;
  }
}
