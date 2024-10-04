// Define the chart function
function chart(data) {
  // Specify the chart's dimensions.
  const width = 928;
  const height = width;

  // Create the color scales for light and dark modes.
  const lightColor = d3
    .scaleLinear()
    .domain([0, 5])
    .range(["#f6f6f6", "hsl(175,80%,40%)"])
    .interpolate(d3.interpolateHcl);

  const darkColor = d3
    .scaleLinear()
    .domain([0, 5])
    .range(["#1a1a1a", "hsl(175,80%,30%)"])
    .interpolate(d3.interpolateHcl);

  // Compute the layout.
  const pack = d3.pack()
    .size([width, height])
    .padding(3);

  const root = pack(d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value));

  // Create the SVG container.
  const svg = d3.create("svg")
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("style", `max-width: 100%; height: auto; display: block; margin: 0 -14px; background: #fff; cursor: pointer; font-family: 'Poppins', sans-serif;`);

  // Add the dark mode toggle switch
  const toggleContainer = d3.create("div")
    .style("position", "absolute")
    .style("top", "10px")
    .style("left", "10px");

  const toggleButton = toggleContainer.append("button")
    .text("Toggle Dark Mode")
    .style("font-family", "'Poppins', sans-serif")
    .style("padding", "5px 10px")
    .style("cursor", "pointer");

  let isDarkMode = false;

  // Append the nodes.
  const node = svg.append("g")
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
    .attr("fill", d => d.children ? lightColor(d.depth) : "#e9edec")
    .attr("pointer-events", d => !d.children ? "none" : null)
    .on("mouseover", function() { d3.select(this).attr("stroke", "#6b6b6b"); })
    .on("mouseout", function() { d3.select(this).attr("stroke", null); })
    .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));

  // Append the text labels.
  const label = svg.append("g")
    .style("font-family", "'Poppins', sans-serif")
    .style("font-size", "14px")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .style("fill-opacity", d => d.depth < 3 ? 1 : 0)
    .style("display", d => d.depth < 3 ? "inline" : "none")
    .attr("transform", d => {
      if (d.depth === 1) {
        return `translate(${d.x - root.x},${d.y - root.y - d.r + 15})`;
      }
      return `translate(${d.x - root.x},${d.y - root.y})`;
    })
    .each(function(d) {
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

    label.attr("transform", d => {
      const x = (d.x - v[0]) * k;
      const y = (d.y - v[1]) * k;
      if (d.depth === 1) {
        return `translate(${x},${y - d.r * k + 15})`;
      }
      return `translate(${x},${y})`;
    });

    node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("r", d => d.r * k);
  }

  function zoom(event, d) {
    const focus0 = focus;
    focus = d;

    const transition = svg.transition()
      .duration(event.altKey ? 7500 : 750)
      .tween("zoom", d => {
        const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
        return t => zoomTo(i(t));
      });

    label
      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
      .transition(transition)
      .style("fill-opacity", d => d.parent === focus || d.depth < 3 ? 1 : 0)
      .on("start", function(d) { if (d.parent === focus || d.depth < 3) this.style.display = "inline"; })
      .on("end", function(d) { if (d.parent !== focus && d.depth >= 3) this.style.display = "none"; });
  }

  // Toggle dark mode function
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
      svg.style("background", "#121212");
      node.attr("fill", d => d.children ? darkColor(d.depth) : "#2a2a2a");
      label.style("fill", "#ffffff");
      label.selectAll("tspan").style("fill", "#ffffff");
      toggleButton.text("Toggle Light Mode");
    } else {
      svg.style("background", "#ffffff");
      node.attr("fill", d => d.children ? lightColor(d.depth) : "#e9edec");
      label.style("fill", "#000000");
      label.selectAll("tspan").style("fill", (d, i) => i === 1 ? "#555" : "#000000");
      toggleButton.text("Toggle Dark Mode");
    }
  }

  // Add click event to toggle button
  toggleButton.on("click", toggleDarkMode);

  return Object.assign(svg.node(), {toggleContainer: toggleContainer.node()});
}

// Export the chart function
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
