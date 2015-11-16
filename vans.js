var margin = { top: 20, right: 20, bottom: 30, left: 60 },
    width  = 960 - margin.left - margin.right,
    height = 500 - margin.top  - margin.bottom;

// setup x
var xValue = function(d) { return d.miles },
    xScale = d3.scale.linear().range([0, width]),
    xMap   = function(d) { return xScale(xValue(d)) },
    xAxis  = d3.svg.axis().scale(xScale).orient("bottom");

// setup y
var yValue = function(d) { return d.price / (140000 - d.miles) * 15000},
    yScale = d3.scale.linear().range([height, 0]),
    yMap   = function(d) { return yScale(yValue(d)) },
    yAxis  = d3.svg.axis().scale(yScale).orient("left");

// setup fill color
var cValue = function(d) { return d.year },
    color  = d3.scale.category10();

// add the graph canvas to the body of the webpage
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// load data
d3.csv("vans.csv", function(error, data) {

  // change string (from CSV) into number format
  data.forEach(function(d) {
    d.price = +d.price;
    d.miles = +d.miles;
    d.year  = +d.year;
  });

  // don't want dots overlapping axis, so add in buffer to data domain
  xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
  yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);

  // x-axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("Milage");

  // y-axis
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Price");

  // draw dots
  svg.selectAll(".dot")
      .data(data)
    .enter()
    .append("svg:a")
      .attr("xlink:href", function(d) { return d.link })
    .append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", xMap)
      .attr("cy", yMap)
      .style("fill", function(d) { return color(cValue(d)) })
      .on("mouseover", function(d) {
          tooltip.transition()
               .duration(200)
               .style("opacity", .9);
          tooltip.html(d.year + "<br/> (" + xValue(d)
	        + ", " + yValue(d) + ")")
               .style("left", (d3.event.pageX + 5 ) + "px")
               .style("top",  (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          tooltip.transition()
               .duration(500)
               .style("opacity", 0);
      });

  // draw legend
  var legend = svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")" });

  // draw legend colored rectangles
  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  // draw legend text
  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d })
});
