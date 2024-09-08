import { ParentChart } from "./Temp.js";
export class TreeChart extends ParentChart {
  constructor(id, data, colors, platformName) {
    super(id);
    super.add_svg();
    this.data = data;
    this.colors = colors;
    this.platformName = platformName;
    this.g = this.ChartArea.append("g").attr(
      "transform",
      `translate(${this.innerW / 2},${this.innerH / 2})`
    );
    this.draw();
  }

  draw() {
    this.handle_data();
    this.set_color();
    this.draw_path();
    this.draw_text();
    this.draw_circle();
  }
  //   构造层级数据
  handle_data() {
    let _data = d3.group(
      this.data,
      (d) => d["Mechanisms"],
      (d) => d["Patterns"],
      (d) => d["Features"]
    );
    this.rootData = d3
      .hierarchy(_data)
      .sort((a, b) => d3.ascending(a.data.name, b.data.name));
    const radius = this.innerH / 3;
    const tree = d3
      .tree()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

    this.root = tree(this.rootData);
  }

  set_color() {
    const color = d3
      .scaleOrdinal()
      .domain(this.root.children.map((d) => d.data[0]))
      .range(this.root.children.map((d) => this.colors.get(d.data[0])));

    function setColor(d) {
      var name = d.data[0];
      d.color =
        color.domain().indexOf(name) >= 0
          ? color(name)
          : d.parent
          ? d.parent.color
          : null;
      if (d.children) d.children.forEach(setColor);
    }

    setColor(this.root);
  }

  draw_path() {
    let root = this.root;
    this.g
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 4)
      .attr("stroke-dasharray", "1 2.4")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkRadial()
          .angle((d) => d.x)
          .radius((d) => d.y)
      )
      .attr("stroke", (d) => (d.children ? "currentColor" : d.target.color));
  }
  draw_circle() {
    let root = this.root;
    let circles = this.g
      .append("g")
      .selectAll("circle")
      .data(root.descendants())
      .join("circle")
      .attr(
        "transform",
        (d) => `
      rotate(${(d.x * 180) / Math.PI - 90})
      translate(${d.y},0)`
      )
      .attr("fill", (d) => d.color)
      .attr("r", 3);

    circles
      .on("mouseover", (e, d) => {
        let html = ` <p> ${
          d.depth === 0
            ? ` Platform is ${
                this.platformName ?? "All Platform"
              } - Number of Features is  ${this.root.leaves().length}`
            : d.children
            ? `${d.data[0]} ${d.leaves().length} `
            : d.data["Definition of Feature"]
        }  </p>`;
        this.tips_show(e, d, html);
      })
      .on("mouseout", this.tips_hide);
  }
  draw_text() {
    this.g
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .selectAll("text")
      .data(this.root.descendants())
      .join("text")
      .attr(
        "transform",
        (d) => `
    rotate(${(d.x * 180) / Math.PI - 90})
    translate(${d.y},0)
    rotate(${d.x >= Math.PI ? 180 : 0})`
      )
      .attr("dy", "0.31em")
      .attr("x", (d) => (d.x < Math.PI === !d.children ? 6 : -6))
      .attr("text-anchor", (d) =>
        d.x < Math.PI === !d.children ? "start" : "end"
      )
      .text((d) => {
        return d.depth < 1 ? d.data[0] : "";
      })
      .clone(true)
      .lower()
      .attr("stroke", "white");
  }
}
