const ED_DATA = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
const COUNTY_DATA = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';

let width = 1000;
    height = 600;

let svg = d3.select("#map").append("svg")
  .attr("id", "svg")
  .attr("width", width)
  .attr("height", height)

let g = svg.append("g")
  .attr("id", "legend")
  .attr("class", "key")
  .attr("transform", "translate(0,40)");

let path = d3.geoPath();
let attainment = d3.map();

let tooltipTemp = d3.select("body")
  .append("div")
  .attr("class" , "tooltipTemp")
  .attr("id", "tooltip")
  .style("position", "absolute")
  .style("z-index", "20")

let promises = [
  d3.json(COUNTY_DATA),
  d3.json(ED_DATA, (d) => {attainment.set(d.fips, +d.bachelorsOrHigher)})
]

Promise.all(promises).then(ready)

function ready([us,ed]) {

  us.objects.counties.geometries.forEach(function(g) {
    let matchedArray = ed.filter((e) => e.fips === g.id);
    Object.assign(g, g, ...matchedArray);
  });

  let geometries = us.objects.counties.geometries;
  let dataMax = d3.max(geometries, (d) => d.bachelorsOrHigher);
  let dataMin = d3.min(geometries, (d) => d.bachelorsOrHigher);

  let x = d3.scaleLinear()
    .domain([dataMin, dataMax])
    .rangeRound([540, 840]);

  let increments = 10;
  let color = d3.scaleThreshold()
    .domain([0,10,20,30,40,50,60,70,80])
    .range(d3.schemeRdYlGn[increments]);

  g.selectAll("rect")
    .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
    .enter().append("rect")
      .attr("height", 8)
      .attr("x", function(d) { return x(d[0]); })
      .attr("y", -10)
      .attr("width", function(d) { return (x(d[1]) - x(d[0])); })
      .attr("fill", function(d) { return color(d[0]); });

  g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -16)
    .attr("fill", "black")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Educational Attainment");

  g.call(d3.axisBottom(x)
      .ticks(10)
      .tickSize(13)
      .tickValues(color.domain())
      .tickFormat(function(x, i) { return i ? x : x + "%"; }))
    .select(".domain")
    .remove();

  let compiledData = d3.map();

  ed.map((geometry) =>
    compiledData.set(geometry.fips, {
      areaName: geometry.area_name,
      education: geometry.bachelorsOrHigher,
      state: geometry.state
    }))

  svg.append("g")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
      .enter()
    .append("path")
      .attr("class", "county")
      .attr("data-fips", d => d.id)
      .attr("data-education", d => compiledData.get(d.id).education)
      .attr("d", path)
      .attr("fill", (d) => { return color(compiledData.get(d.id).education); })
    .on("mousemove", d => {
      tooltipTemp
        .attr("data-education", compiledData.get(d.id).education || 0)
        .attr("class", "tool")
        .style("left", d3.event.pageX - 50 + "px")
        .style("top", d3.event.pageY - 70 + "px")
        .style("display", "inline-block")
        .html(
          `${compiledData.get(d.id).areaName}, ${compiledData.get(d.id).state}<br>${compiledData.get(d.id).education} %`
        );
    })
    .on("mouseout", () => tooltipTemp.style("display", "none"));

}