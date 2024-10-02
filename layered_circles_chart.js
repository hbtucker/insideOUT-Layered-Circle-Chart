function _1(md){return(
md`<div style="color: grey; font: 13px/25.5px var("'Poppins', sans-serif"); text-transform: uppercase;"><h1 style="display: none;">Layered Org Chart</h1>
  
  <div style="color: grey; font: 10px/25.5px var("'Poppins', sans-serif"); text-transform: uppercase;"><h2 style="display: none;">Click each circle to zoom in and out of each layer. The deepest layer represents the responsibilities for an individual.</h2>`
)}

function _chart(d3,data)
{
  // Specify the chart's dimensions.
  const width = 928;
  const height = width;

  // Create the color scale.
  const color = d3
    .scaleLinear()
    .domain([0, 5])
    .range(["#f6f6f6", "hsl(175,80%,40%)"])
    .interpolate(d3.interpolateHcl);

  // Compute the layout.
  const pack = (data) =>
    d3.pack().size([width, height]).padding(3)(
      d3
        .hierarchy(data)
        .sum((d) => d.value)
        .sort((a, b) => b.value - a.value)
    );
  const root = pack(data);

  // Create the SVG container.
  const svg = d3
    .create("svg")
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr(
      "style",
      `max-width: 100%; height: auto; display: block; margin: 0 -14px; background: #f6f6f6; cursor: pointer; font-family: 'Poppins', sans-serif;`
    );

  // Append the nodes.
  const node = svg
    .append("g")
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
    .attr("fill", (d) => (d.children ? color(d.depth) : "#e9eaed"))
    .attr("pointer-events", (d) => (!d.children ? "none" : null))
    .on("mouseover", function () {
      d3.select(this).attr("stroke", "#1f1f1f");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", null);
    })
    .on(
      "click",
      (event, d) => focus !== d && (zoom(event, d), event.stopPropagation())
    );

  // Append the text labels.
  const label = svg
    .append("g")
    .style("font-family", "'Poppins', sans-serif")
    .style("font-size", "15px")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .style("fill-opacity", (d) => (d.depth < 3 ? 1 : 0))
    .style("display", (d) => (d.depth < 3 ? "inline" : "none"))
    .attr("transform", (d) => {
      if (d.depth === 1) {
        return `translate(${d.x - root.x},${d.y - root.y - d.r + 15})`;
      }
      return `translate(${d.x - root.x},${d.y - root.y})`;
    })
    .each(function (d) {
      const el = d3.select(this);
      el.append("tspan")
        .attr("x", 0)
        .attr("y", d.depth === 1 ? "0" : "-0.7em")
        .text(d.data.name);
      if (d.data.title) {
        el.append("tspan")
          .attr("x", 0)
          .attr("y", d.depth === 1 ? "1.4em" : "0.7em")
          .style("font-size", "10px")
          .style("fill", "#555")
          .text(d.data.title);
      }
    });

  // Create the zoom behavior and zoom immediately in to the initial focus node.
  svg.on("click", (event) => zoom(event, root));
  let focus = root;
  let view;
  zoomTo([focus.x, focus.y, focus.r * 2]);

  function zoomTo(v) {
    const k = width / v[2];

    view = v;

    label.attr("transform", (d) => {
      const x = (d.x - v[0]) * k;
      const y = (d.y - v[1]) * k;
      if (d.depth === 1) {
        return `translate(${x},${y - d.r * k + 15})`;
      }
      return `translate(${x},${y})`;
    });

    node.attr(
      "transform",
      (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    );
    node.attr("r", (d) => d.r * k);
  }

  function zoom(event, d) {
    const focus0 = focus;

    focus = d;

    const transition = svg
      .transition()
      .duration(event.altKey ? 7500 : 750)
      .tween("zoom", (d) => {
        const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
        return (t) => zoomTo(i(t));
      });

    label
      .filter(function (d) {
        return d.parent === focus || this.style.display === "inline";
      })
      .transition(transition)
      .style("fill-opacity", (d) => (d.parent === focus || d.depth < 3 ? 1 : 0))
      .on("start", function (d) {
        if (d.parent === focus || d.depth < 3) this.style.display = "inline";
      })
      .on("end", function (d) {
        if (d.parent !== focus && d.depth >= 3) this.style.display = "none";
      });
  }

  return svg.node();
}


function _data(FileAttachment){return(
FileAttachment("data.json").json()
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["data.json", {url: new URL("./files/data.json", import.meta.url), mimeType: "application/json", toString}],
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("chart")).define("chart", ["d3","data"], _chart);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  return main;
}
