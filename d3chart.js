// import * as d3 from "d3";
import { ParentChart } from "./Temp.js";
import { TreeChart } from "./tree.js";

export class PieChart extends ParentChart {
  constructor(id, colors, level_data, platforms_data, showText = false) {
    super(id);
    super.add_svg();
    this.colors = colors;
    this.level_data = level_data;
    this.platforms_data = platforms_data;
  }
  set_data(data, sortFunc) {
    this.data = data;
    this._handle_data(sortFunc);
  }
  setDepth(num) {
    this.depth = num;
  }
  _handle_data(sortFunc) {
    let pie_data = d3.rollups(
      this.data,
      (d) => d3.sum(d, (v) => v.value),
      (d) => d.key
    );
    this.pie_data = d3
      .pie()
      .value((d) => d[1])
      .sort((a, b) => (sortFunc ? sortFunc : d3.ascending(a[0], b[0])))(
      pie_data
    );
  }
  set_pie_size(outerRadiusRate, innerRadiusRate) {
    let r = Math.min(this.innerW, this.innerH) / 2;
    this.outerRadius = r * outerRadiusRate;
    this.innerRadius = r * innerRadiusRate;
    this.arc = d3
      .arc()
      .innerRadius(r * innerRadiusRate)
      .outerRadius(r * outerRadiusRate)
      .startAngle((d) => d.startAngle)
      .endAngle((d) => d.endAngle)
      .padAngle(0.002);
  }

  draw_chart(colorFunc) {
    this.midPoint = { x: this.innerW / 2, y: this.innerH / 2 };
    this.g = this.ChartArea.append("g").attr(
      "transform",
      `translate(${this.midPoint.x},${this.midPoint.y})`
    );

    let g = this.g;
    let paths_g = g.selectAll("myg").data(this.pie_data).join("g");
    let paths = paths_g
      .append("path")
      .attr("class", (d) => toValidClassName(d.data[0]) + ` depth${this.depth}`)
      .attr("id", (d) => toValidClassName(d.data[0]))
      .attr("data-inner-middle-position", (d) => this.get_x_y_inner(d))
      .attr("data-outer-middle-position", (d) => this.get_x_y_outer(d))
      .attr("data-angel", (d) => {
        return `angel-${(d.startAngle + d.endAngle) / 2}`;
      })
      .attr("d", this.arc)

      .attr("fill", (d, index) => colorFunc(d.data[0], d.index));

    this.paths_g = paths_g;
    paths
      .on("mouseover", (e, d) => {
        let html = ` <p> ${d.data[0]} :${d.data[1]} </p>`;
        d3.selectAll(`.linkpath${toValidClassName(d.data[0])}`)
          .attr("stroke", "#83ecf4")
          .attr("stroke-width", 3)
          .raise();
        this.tips_show(e, d, html);
        // 高亮连线
      })
      .on("mouseout", (e, d) => {
        this.tips_hide();
        d3.selectAll(`.linkpath${toValidClassName(d.data[0])}`)
          .attr("stroke", "#f3f3f3")
          .attr("stroke-width", 0.5);
      })
      .on("click", (e, d) => {
        let platform_filter_data = this.platforms_data.filter(
          (v) => v["PlatForm"] === d.data[0]
        );
        // 如果是第四层数据,找到相关平台的features的数据
        if (platform_filter_data.length) {
          let level_data = this.level_data.filter(
            (v) =>
              platform_filter_data.findIndex(
                (x) => x["Features"] === v["Features"]
              ) >= 0
          );
          new TreeChart("viz2", level_data, this.colors, d.data[0]);
          // 跳转到树图
          document
            .getElementById("PlatFormName")
            .scrollIntoView({ behavior: "smooth" });

          // 呈现 所有的features
          d3.select("#featuresDiv")
            .selectAll("p")
            .data(platform_filter_data.map((d) => d["Features"]))
            .join("p")
            .html((d) => d);
          d3.select("#PlatFormName").html(d.data[0]);
        }
      });
  }

  appendText(option) {
    let paths_g = this.paths_g;

    paths_g
      .append("text")
      .attr("transform", (d) => {
        const midpoint = this.arc.centroid(d);

        const angle = (d.startAngle + d.endAngle) / 2;
        const rotateAngle = (angle * 180) / Math.PI - 90; // 转换为角度，并减去 90 度

        return `translate(${midpoint[0]},${midpoint[1]}) rotate(${
          option.rotate ? rotateAngle : 0
        }) `;
      }) //移到中心点的位置
      // .append("textPath")
      // .attr("xlink:href", (d, i) => `#${toValidClassName(d.data[0])}`) // 链接到对应的路径
      .style("text-anchor", "middle") // 使文本居中显示
      .text(
        (d) =>
          `${
            option.length
              ? d.data[0].substring(0, option.length)
              : d.data[0].split("(")[0]
          } `
      )
      .attr("font-size", 8);
  }
  get_x_y_outer = (d) => {
    const arcGenerator = d3
      .arc()
      .innerRadius(this.outerRadius) // 设定内半径，如果是空心饼图，可以调整此值
      .outerRadius(this.outerRadius); // 设定外半径

    const radius =
      (arcGenerator.outerRadius()() + arcGenerator.innerRadius()()) / 2;

    const midAngle = (d.startAngle + d.endAngle) / 2;
    const midRadius = (this.outerRadius + radius) / 2;
    const x = midRadius * Math.cos(midAngle - Math.PI / 2);
    const y = midRadius * Math.sin(midAngle - Math.PI / 2);

    return `${x}<${y}`;
  };
  get_x_y_inner = (d) => {
    const arcGenerator = d3
      .arc()
      .innerRadius(this.innerRadius) // 设定内半径，如果是空心饼图，可以调整此值
      .outerRadius(this.innerRadius); // 设定外半径

    const radius =
      (arcGenerator.outerRadius()() + arcGenerator.innerRadius()()) / 2;

    const midAngle = (d.startAngle + d.endAngle) / 2;
    const midRadius = (this.innerRadius + radius) / 2;
    const x = midRadius * Math.cos(midAngle - Math.PI / 2);
    const y = midRadius * Math.sin(midAngle - Math.PI / 2);

    return `${x}<${y}`;
  };
  // 第三层和第四层的连线
  set_links(data) {
    let g = this.ChartArea.append("g").attr(
      "transform",
      `translate(${this.innerW / 2},${this.innerH / 2})`
    );

    data.forEach((d, index) => {
      // if (index > 0) return;
      let fromAngel = get_mid_angel(d["PlatForm"], "-");
      let endAngle = get_mid_angel(d["Features"], "-");
      let fromPosition = get_mid_point_position(
        d["PlatForm"],
        "<",
        "data-inner-middle-position"
      );
      let toPosition = get_mid_point_position(
        d["Features"],
        "<",
        "data-outer-middle-position"
      );

      let lengthLine =
        Math.random() * (this.innerRadius - (this.innerRadius / 0.9) * 0.6);
      getLineEnd(fromPosition, lengthLine, g, d["PlatForm"]);
      getLineEnd(
        toPosition,
        lengthLine - (this.innerRadius - (this.innerRadius / 0.9) * 0.6),
        g,
        d["PlatForm"]
      );

      const arc = d3
        .arc()
        .innerRadius(this.innerRadius - lengthLine)
        .outerRadius(this.innerRadius - lengthLine)
        .startAngle(fromAngel)
        .endAngle(endAngle);

      g.append("path")
        .attr("d", arc)
        .attr("class", "linkpath" + toValidClassName(d["PlatForm"]))
        .attr("stroke", "lightgray")
        .attr("stroke-width", 0.5)
        .attr("fill", "none");
    });
  }
}

export function toValidClassName(input) {
  // 去掉前后的空格
  let className = input.trim();

  // 替换非字母数字和允许的符号（- 和 _）为连字符
  className = className.replace(/[^a-zA-Z-_]/g, "");

  // 如果类名以数字开头，则在前面加上字母前缀
  if (/^\d/.test(className)) {
    className = "" + className;
  }

  return className;
}

function get_mid_point_position(name, spliterSymbol, OurterOrInner) {
  let positionTo = d3.select(`.${toValidClassName(name)}`).attr(OurterOrInner);
  positionTo = positionTo.split(spliterSymbol);
  positionTo = {
    x: parseFloat(positionTo[0]),
    y: parseFloat(positionTo[1]),
  };

  return positionTo;
}

function get_mid_angel(name, spliterSymbol) {
  try {
    let positionTo = d3.select(`.${toValidClassName(name)}`).attr("data-angel");
    positionTo = parseFloat(positionTo.split(spliterSymbol)[1]);
    return positionTo;
  } catch {
    return 0;
  }
}
function getLineEnd(fromPosition, lineLength, g, name) {
  const distanceToCenter = Math.sqrt(
    Math.pow(0 - fromPosition.x, 2) + Math.pow(0 - fromPosition.y, 2)
  );

  const lineEnd = {
    x: fromPosition.x - (lineLength / distanceToCenter) * (fromPosition.x - 0),
    y: fromPosition.y - (lineLength / distanceToCenter) * (fromPosition.y - 0),
  };
  // 绘制短线
  g.append("line")
    .attr("x1", fromPosition.x)
    .attr("y1", fromPosition.y)
    .attr("x2", lineEnd.x)
    .attr("y2", lineEnd.y)
    .attr("class", "linkpath" + toValidClassName(name))
    .attr("stroke", "lightgray")
    .attr("stroke-width", 0.5);
}
