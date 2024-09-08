import { PieChart, toValidClassName } from "./d3chart.js";
import { TreeChart } from "./tree.js";

d3.select("body")
  .append("div")
  .style("display", "none")
  .attr("position", "absolute")
  .attr("class", "d3-tip");
async function main({ type }) {
  // 添加提示框

  let level_data = await d3.csv("level.csv");
  let feature_data = await d3.csv("Features.csv");
  let PlatForms_data = await d3.csv("platform.csv");

  combine_level_feature_data(level_data, feature_data);

  let Mechanisms_data = get_group_value_data(
    level_data,
    "Mechanisms",
    type == "app" ? "app_count" : "website_count"
  );
  let pattern_data = get_group_value_data(
    level_data,
    "Patterns",
    type == "app" ? "app_count" : "website_count"
  );
  let features_data = get_group_value_data(
    level_data,
    "Features",
    type == "app" ? "app_count" : "website_count"
  );
  let platforms_data = get_group_value_data(
    PlatForms_data,
    "PlatForm",
    "Values"
  );
  let colors = get_colors(level_data);

  let pieGen = new PieChart("viz1", colors, level_data, PlatForms_data);
  // Mechanisms
  pieGen.set_data(Mechanisms_data);
  pieGen.set_pie_size(0.15, 0.05);
  pieGen.draw_chart();
  pieGen.appendText({ rotate: false });
  // pattern_data
  pieGen.set_data(pattern_data);
  pieGen.set_pie_size(0.15, 0.2);
  pieGen.draw_chart();
  pieGen.appendText({ rotate: true, length: 2 });

  // pattern_data
  // 这里要给一个排序方法
  const sortFunc = (a, b) =>
    level_data.findIndex((d) => d["Features"] == a[0]) >
    level_data.findIndex((d) => d["Features"] == b[0]);
  pieGen.set_data(features_data, sortFunc);
  pieGen.set_pie_size(0.6, 0.205);
  pieGen.draw_chart();
  pieGen.appendText({ rotate: true });

  // platforms_data
  pieGen.set_data(platforms_data);
  pieGen.set_pie_size(0.8, 0.7);
  pieGen.draw_chart();
  pieGen.appendText({ rotate: false });
  // 画3-4的链接线
  pieGen.set_links(PlatForms_data);

  new TreeChart("viz2", level_data, colors);
  // 生成17个平台的小图
  gen_platform_chart(PlatForms_data, level_data, colors);
  function get_colors() {
    // Mechanisms的颜色数组
    let colorMechanisms = new Map();
    colorMechanisms.set("1PressuringUsers", "#ffe599");
    colorMechanisms.set("2EnticingUsers", "#b6d7a8");
    colorMechanisms.set("3TrappingUsers", "#ea9999");
    colorMechanisms.set("4LullingUsers", "#a4c2f4");

    // Patterns的颜色数组
    let colorPatterns = new Map();
    const Patterns = d3
      .groups(level_data, (d) => d["Patterns"])
      .map((d) => d[0]);
    let color = [
      "#ffeac5",
      "#fff0c5",
      "#fff9c4",
      "#e1f2cb",
      "#daf2cb",
      "#d4f2cb",
      "#cbf2d1",
      "#f5d8d3",
      "#f6d3d3",
      "#f5d3de",
      "#d2dafa",
      "#d2e0f9",
      "#d2e7fa",
      "#d2eefa",
    ];
    Patterns.forEach((d, index) => {
      colorPatterns.set(d, color[index]);
    });

    // Features颜色
    let colorFeatures = new Map();
    level_data.forEach((d) => {
      colorFeatures.set(d["Features"], colorPatterns.get(d["Patterns"]));
    });
    // platform颜色
    let colorPlatForm = new Map();
    const platform_color_scale = d3
      .scaleLinear()
      .range(["#a4c2f4", "#ea9999"])
      .domain([0, platforms_data.length - 1]);
    platforms_data.forEach((d, index) => {
      colorPlatForm.set(d.key, platform_color_scale(index));
    });
    const colors = new Map([
      ...colorMechanisms,
      ...colorPatterns,
      ...colorFeatures,
      ...colorPlatForm,
    ]);

    return colors;
  }
}

function combine_level_feature_data(level_data, feature_data) {
  level_data.forEach((d) => {
    let value = feature_data.find((v) => v.Features === d.Features);
    if (value) {
      d.app_count = value.app_count;
      d.website_count = value.website_count;
    } else {
      d.app_count = 0;
      d.website_count = 0;
    }
  });
}
function get_group_data(data, name) {
  let _data = d3
    .rollups(
      data,
      (d) => d3.sum(d, (v) => v["app_count"]),
      (d) => d[name]
    )
    .map((d) => {
      return { key: d[0], value: d[1] };
    });
  _data.sort((a, b) => a.key > b.key);
  return _data;
}
function get_group_value_data(data, name, value_field) {
  let _data = d3
    .rollups(
      data,
      (d) => d3.sum(d, (v) => v[value_field]),
      (d) => d[name]
    )
    .map((d) => {
      return { key: d[0], value: d[1] };
    });

  _data.sort((a, b) => a.key > b.key);

  return _data;
}

function gen_platform_chart(platforms_data, level_datas, colors) {
  // 生成div

  let platforms = d3
    .groups(platforms_data, (d) => d["PlatForm"])
    .map((d) => d[0]);
  gen_platform_div({ platforms, level_datas, colors, platforms_data });
  platforms.forEach((d) => {
    let platform_filter_data = platforms_data.filter(
      (v) => v["PlatForm"] === d
    );

    if (platform_filter_data.length) {
      let level_data = level_datas.filter(
        (v) =>
          platform_filter_data.findIndex(
            (x) => x["Features"] === v["Features"]
          ) >= 0
      );
      // 添加 platform的名字
      new TreeChart("small" + toValidClassName(d), level_data, colors, d);
    }
  });
}

function gen_platform_div({ platforms, level_datas, colors, platforms_data }) {
  d3.select("#viz3").selectAll("*").remove();
  let div = d3
    .select("#viz3")
    .selectAll("div")
    .data(platforms)
    .join("div")
    .attr("class", "smallTree");

  div.append("div").html((d) => d);
  div
    .append("div")
    .attr("id", (d) => "small" + toValidClassName(d))
    .attr("height", "100%")
    .attr("width", "100%");

  div.on("click", (e, d) => {
    get_TreeMap_by_div({
      platforms,
      level_datas,
      colors,
      platforms_data,
      platform: d,
    });
  });
}

function get_TreeMap_by_div({ level_datas, colors, platforms_data, platform }) {
  // debugger;
  let platform_filter_data = platforms_data.filter(
    (v) => v["PlatForm"] === platform
  );

  if (platform_filter_data.length) {
    let level_data = level_datas.filter(
      (v) =>
        platform_filter_data.findIndex(
          (x) => x["Features"] === v["Features"]
        ) >= 0
    );
    // 添加 platform的名字
    new TreeChart("viz2", level_data, colors, platform);
    d3.select("#featuresDiv")
      .selectAll("p")
      .data(platform_filter_data.map((d) => d["Features"]))
      .join("p")
      .html((d) => d);
    d3.select("#PlatFormName").html(platform);
    document
      .getElementById("PlatFormName")
      .scrollIntoView({ behavior: "smooth" });
  }
}
await main({ type: "app" });

d3.select("#app").on("click", async () => {
  await main({ type: "app" });
  d3.select('#siteName').html("App")
});
d3.select("#web").on("click", async () => {
  await main({ type: "web" });
  d3.select('#siteName').html("Web")
});
