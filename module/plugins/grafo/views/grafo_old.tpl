<!DOCTYPE html>
<meta charset="utf-8">
<style>
html, body {
  height: 100%;
  width: 100%;
}

#grafo {
  width: 100%;
  height: 100%;
}

#debug {
  background: #ddd;
}

.links line {
  stroke: #999;
  stroke-opacity: 0.6;
}

.nodes circle {
  stroke: #fff;
  stroke-width: 1.5px;
}

</style>
<input  id="txtSearch" type="text" value="type:host bp:>1">
<button id="btnSearch">Search</button>
<div id="debug">debug</div>
<svg id="grafo"></svg>

<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3-cloud/1.2.5/d3.layout.cloud.min.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>

<script>

var svg = d3.select("svg"),
    width  = parseInt(svg.style('width')),
    height = parseInt(svg.style('height'));

var color = d3.scaleOrdinal(d3.schemeCategory20);


// var pack = d3.layout.pack()
//     .size([r, r])
//     .value(function(d) { return d.size; })

var COLOR_OK        = '#8BC34A';
var COLOR_WARNING   = '#FAA732';
var COLOR_CRITICAL  = '#FF7043';
var COLOR_UNKONWN   = '#49AFCD';

var krill = {
  host_state_color: function(val){
    if(val == 0) {
  		return COLOR_OK;
  	} else if ( val == 1 ) {
  		return COLOR_CRITICAL;
  	} else if ( val == 2 ) {
  		return COLOR_WARNING;
  	} else if ( val == 3 ) {
  		return COLOR_UNKONWN;
  	}
  }
};


var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

function draw(search) {
  svg.selectAll("*").remove();
  d3.json("grafo.json?search=" + search, function(error, graph) {
    if (error) throw error;

    var link = svg.append("g")
        .attr("class", "links")
      .selectAll("line")
      .data(graph.links)
      .enter().append("line")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

    var nodes = svg.append("g")
        .attr("class", "nodes")
      .selectAll("circle")
      .data(graph.nodes)
      .enter().append("circle")
        .attr("r",    function(d) { return 3 * d.business_impact; })
        //.attr("width",    function(d) { return 3 * d.business_impact; })
        //.attr("height",    function(d) { return 3 * d.business_impact; })
        .attr("fill", function(d) { return krill.host_state_color(d.state_id); })
        .on("click", function(d){
          console.log(d)
          $('#txtSearch').val(d.id)
          draw(""+d.id)
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));


    //   var labels = svg.append("g")
    //       .attr("class", "labels")
    //     .selectAll("text")
    //     .data(graph.nodes)
    //     .enter().append("svg:text")
    //     .text(function(d) { return d.id; });
    //
    // nodes.append("title")
    //     .text(function(d) { return d.id; });



    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    function ticked() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      nodes
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });

      // labels
      //     .attr("x", function(d) { return d.x; })
      //     .attr("y", function(d) { return d.y; })
      //     .text(function(d) { return d.id + Math.rand() });
    }
  });
}

draw('type:host bp:>1');


$('#btnSearch').on("click", function(){
  draw($('#txtSearch').val())
});

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

</script>
