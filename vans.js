'use strict'

const MILES_PER_YEAR = 15000
const TAX = 1.06

// Dealership fees, defaulting to 800 if unknown.
let fees = (car) => ({
  'sport honda'                    : 299,
  'mile one'                       : 299,
  'mercedes-benz of silver spring' : 299,
  'carmax'                         : 99,
  'chantilly auto sales'           : 595,
  'joyce koons'                    : 800,
  'win kelly'                      : 299,
  'euromotorcars'                  : 299,
}[car.dealer] || 800)

let process = (car) => {
  // expand tags
    car.tags.split("|").reduce((tags, tag) => {
      let t = tag.split(":")
     tags[t[0]] = t[1] === undefined ? 1 : t[1]
     return tags
    }, car)

  car.fees  = fees(car)
  car.price = car.quote || +car.price
  car.total = (car.price - (car.discount||0) + car.fees) * TAX
  car.miles = +car.miles
  car.year  = +car.year
}

let cost_per_year = (car, total_miles) => car.total / (total_miles - car.miles) * MILES_PER_YEAR

var margin = { top: 20, right: 20, bottom: 130, left: 60 },
    width  = 960 - margin.left - margin.right,
    height = 600 - margin.top  - margin.bottom;

// setup x
var xValue = function(d) { return d.miles },
    xScale = d3.scale.linear().range([0, width]),
    xMap   = function(d) { return xScale(xValue(d)) },
    xAxis  = d3.svg.axis().scale(xScale).orient("bottom");

// setup y
var yScale = d3.scale.linear().range([height, 0]),
    yAxis  = d3.svg.axis().scale(yScale).orient("left");
var yValue, yMap;

function updateY(total_miles) {
    yValue = car => cost_per_year(car, total_miles)
    yMap   = function(d) { return yScale(yValue(d)) };

    svg.select("g .y.axis").call(yAxis);

    var data = svg.selectAll("g .dot").data();

    yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);
    // svg.selectAll("g .y.axis").call(yAxis)
    svg.selectAll("g .dot").attr("cy", function(d) {
        return yMap(d);
    })
}

// setup fill color
var cValue = function(d) { return `${d.year} ${d.trim}` },
    color  =  d3.scale.category20c()
        .domain(['2012 touring', '2013 touring', '2014 touring', '2015 touring', '2012 touring elite', '2013 touring elite', '2014 touring elite', '2015 touring elite'])

// add the graph canvas to the body of the webpage
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var table   = d3.select("body").append("table");
var thead   = table.append("thead");
var tbody   = table.append("tbody");
var columns = [
    { head : 'year',   w : 50,  cl : '', html : r => r.year },
    { head : 'trim',   w : 60,  cl : '', html : r => r.trim },
    { head : 'color',  w : 120, cl : '', html : r => r.color },
    { head : 'miles',  w : 50,  cl : '', html : r => r.miles },
    { head : 'price',  w : 50,  cl : '', html : r => `$${r.price}` },
    { head : 'dealer', w : 50,  cl : '', html : r => `${r.dealer} <i>/ ${r.city}, ${r.state} (${r.distance} mi)</i>` }
];
thead.append("tr").selectAll("th").data(columns).enter()
  .append("th")
    .style("width", d => `${d.w}px` )
    .attr('class', c => c.cl ).text( c => c.head );

// set up slider for total expected miles
(() => {
    let margin = { top: 10, right: 20, bottom: 10, left: 60 },
        width  = 960 - margin.left - margin.right,
        height = 30 - margin.bottom - margin.top;
    let x = d3.scale.linear()
        .domain([75000, 200000])
        .range([0, width])
        .clamp(true);

    let brush = d3.svg.brush().x(x).extent([0, 0]).on("brush", brushed);
    function brushed() {

        var value = brush.extent()[0];
        if (d3.event.sourceEvent) { // not a programmatic event
            value = x.invert(d3.mouse(this)[0]);
            brush.extent([value, value]);
        }
        handle.attr("cx", x(value));

        updateY(value);
    }

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${500 + height/2})`)
        .call(d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(d => { return d })
            .tickPadding(12))
       .append("text")
         .attr("class", "label")
         .attr("x", width)
         .attr("y", -6)
         .style("text-anchor", "end")
         .text("Lifetime Milage");

    // add slider
    var slider = svg.append("g")
        .attr("class", "slider")
        .call(brush);
    slider.selectAll(".extent,.resize").remove();

    var handle = slider.append("circle")
        .attr("class", "handle")
        .attr("transform", `translate(0, ${500 + height/2})`)
        .attr("r", 12);

    slider
        .call(brush.event)
        .transition()
        .duration(750)
        .call(brush.extent([140000,140000]))
        .call(brush.event);
})()

// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// load data
d3.csv("vans.csv", function(error, data) {

  // change string (from CSV) into number format
  data.forEach(process)

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
      .text("Price / year");

  let r = d3.scale.linear()
    .domain([75,5])
    .range([1,10])
    .clamp(true)


  // draw dots
  svg.selectAll(".dot")
      .data(data)
    .enter()
    .append("svg:a")
      .attr("xlink:href", function(d) { return d.link })
    .append("circle")
      .attr("class", "dot")
      .attr("r", car => r(car.distance))
      .attr("cx", xMap)
      .attr("cy", yMap)
      .style("fill",  car => car.sold ? "none" : color(cValue(car)))
      .style("stroke", car => car.sold ? color(cValue(car)) : "none" )
      .on("mouseover", function(d) {
          tooltip.transition()
               .duration(200)
               .style("opacity", .9);
          tooltip.html(`${d.year} ${d.trim}<br/>$${d.price}<br/>${d.miles} miles`)
               .style("left", (d3.event.pageX + 15 ) + "px")
               .style("top",  (d3.event.pageY +10) + "px");
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
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  // draw legend colored rectangles
  legend.append("rect")
      .attr("x", width - 90)
      .attr("width", 10)
      .attr("height", 18)
      .style("fill", color);

  // draw legend text
  legend.append("text")
      .attr("x", width - 75)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .text(function(d) { return d })

  // draw a table of data
  var rows = tbody.selectAll("tr")
    .data(data)
    .enter()
    .append("tr");

  var cells = rows.selectAll("td")
    .data( (r, i) => columns.map( c => {
        var cell = {};
        d3.keys(c).forEach(function(k) {
            cell[k] = typeof c[k] == 'function' ? c[k](r,i) : c[k]
        });
        return cell;
    } ))
    .enter()
    .append("td")
      .style("width", d => `${d.w}px` )
      .html( d => d.html ).attr('class', d => d.cl );
});
