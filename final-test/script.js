const trackPromise = d3.csv('trackinfo.csv', parseTrack)
	// .then(data => new Map(data));
const artistPromise = d3.csv('artist.csv', parseArtist);

Promise.all([
		trackPromise,
		artistPromise,
	])
	
	.then(([trackinfo, artist]) => {

		//Convert artistcsv to a map
		const artist_tmp = artist.map(d =>{
			return [d.artists_id, d]
		});

		// console.log(artist_tmp);
		const artistMap = new Map(artist_tmp);
		console.log(artistMap);

		const musicAugmented = trackinfo.map(d => {

			const artist_id = artistMap.get(d.artists_id);
			const artist_image = artistMap.get(d.artist_image);
			const artist_followers_total = artistMap.get(d.followers_total);
			const artists_popularity = artistMap.get(d.artists_popularity);
			const artist_genre = artistMap.get(d.genres);

			if (artist_id){
				d.artists_id = artist_id
			}
			if (artist_image){
				d.artists_image = artist_image
			}
			if (artist_followers_total){
				d.artist_followers_total = artist_followers_total
			}
			if (artists_popularity){
				d.artists_popularity = artists_popularity
			}
			if (artist_genre){
				d.artist_genre = artist_genre
			}

		
		return d;

		});
		console.log(musicAugmented);

		const yearData = d3.nest()
			.key(d => d.year)
			.entries(musicAugmented);

		console.log(yearData);

		//DROPDOWN MENU
		const menu = d3.select(".nav")
                       .append("select");

        menu.selectAll("option")
            .data(yearData)
            .enter()
            .append("option")
            .attr("value", d => d.key)
            .html(d=> d.key);

        menu.on("change", function(){

            const year = this.value;

            const data = transform(year,yearData); //WHAT DOES IT MEAN 

            scatterPlot(data);

         })

		const charts = d3.select('.plot-1')
			.selectAll('.chart')
			.enter()
			.data(yearData);


		const chartsEnter = charts.enter()
			.append('div')
			.attr('class','chart')
			.data(yearData);

		charts.merge(chartsEnter)
			.each(function(d){
				scatterPlot(
					d.values,
					this,
					d.key
					)
			});
		charts.exit().remove();


	})

//Function "signature": what arguments are expected, how many, and what they should look like
function scatterPlot(data, rootDOM){

	//data
	//[{}, {}, {}...]x9

		const margin = {top: 60, right: 60, bottom: 60, left: 60},
		    width = 900 - margin.left - margin.right,
		    height = 400 - margin.top - margin.bottom;

		const xScale = d3.scaleLinear().range([0, width]).domain([0,100]);
		const yScale = d3.scaleLinear().range([height, 0]).domain([0,130]);

		//UPDATE SELECTION 
		const plot1 = d3.select('.plot-1')
			.append('svg')
			.attr('width', width + 100)
			.attr('height', height + 100)
			.attr("transform","translate(" + margin.left + "," + margin.top + ")")

		const xAxis = plot1.append("g")
	       .attr('transform', 'translate(0,' + height + ')') 
	       .attr("class", "xAxis")
	       .call(d3.axisBottom()
	       	.ticks(10)
	       	// .tickSize(-width)
	       	.scale(xScale));

	    const tooltip = d3.select('.plot-1').append("div")
	      .attr("class", "tooltip")
	      .attr('width', 50)
	      .style("opacity", 0);

		  // Add the Y Axis
		// const yAxis = plot1.append("g")
	 //       .attr("class", "y axis")
	 //       .call(d3.axisLeft().scale(yScale));

		const nodes = plot1.selectAll('.node')
			.data(data);

		//ENTER SECTION 
		const nodesEnter = nodes.enter()
			.append('g')
			.attr('class', 'node')
			.attr('transform', d => `translate(${xScale(d.ranking)} , ${yScale(d.popularity)})`);

		nodesEnter.append('circle')
			.style('stroke','red')
			.attr('r',2)
			
			.transition()
			.duration(500)
			.style('stroke','red')
			.style('fill','black')
			.style('fill-opacity',.8)
			.style('stroke-width',.8)
			.attr('r', 10)

		nodes = nodes.merge(nodesEnter)

			.on("mouseenter", function(d){
				d3.select(this)
				.style('fill','red')
				.attr('r',20)
				.attr('fill-opacity', 1)
				// .style('stroke-width',2);
				
			    tooltip.transition()
			          .duration(200)
			          .style('opacity',1)
			    tooltip
			    	//TRACK IMAGE AND RANKING DOESNT MATCH WITH THE TRACK AND ARTIST 
			          .html(d.track_name + " - " + d.artist + "<br/>" + "Ranking:" + d.ranking
			            +"<br/>" + "<br/>" + "<img src='"+d.track_image+"'/>"); 
			})

			.on("mouseout", function(d){
				d3.select(this)
				.attr('r', 10)
				.attr('fill','black')
				.attr('fill-opacity', 1);
				// .style('stroke-width',1);

			    tooltip.transition()
			         .duration(500)
			         .style("opacity", 0);
			});


			const simulation = d3.forceSimulation();

			const forceX = d3.forceX().x(d=> width/2);
			const forceY = d3.forceY().y(d=> height/2);
			const forceCollide = d3.forceCollide().radius(10);

			simulation
				.force('x', forceX)
				.force('y', forceY)
				.force('collide', forceCollide)
				.force('charge', d3.forceManyBody().strength(5))
				//.force('link', forceLink)
				.nodes(nodes) //start the simulation
				.on('tick', () => {
					nodes.merge(nodesEnter)
						.attr('transform', d => `translate(${xScale(d.ranking)} , ${yScale(d.popularity)})`);
				})

				.restart();

}



//Utility functions for parsing metadata, migration data, and country code
function parseTrack(d){
	return {
		year: +d.Year,
		artists_id: d.artists_id,
		artist: d.artists,
		track_name: d.track_name,
		follower: +d.follower,
		genre: d.genre,
		popularity: +d.popularity,
		year: +d.year,
		album: d.Album,
		track_id: d.track_id,
		ranking: +d.ranking,
		danceability: +d.danceability,
		energy: +d.energy,
		loudness: +d.loudness,
		speechiness: +d.speechiness,
		acousticness: +d.acousticness,
		instrumentalness: +d.instrumentalness,
		liveness: +d.liveness,
		valence: +d.valence,
		tempo: +d.tempo,
		Preview: d.Preview_url,
		track_image: d.track_image,
		x: Math.random() * 900,
    	y: Math.random() * 800
	}
}

function parseArtist(d){

	return {
		followers_total: +d.followers_total,
		genres: d.artists_genres,
		artists_id: d.artists_id,
		artist_image: d.image_url,
		artists_name: d.artists_name,
		artists_popularity: +d.artists_popularity

	}
}

function transform(year, data){
	const musicFiltered = data.filter(d => d.year === year);

	return musicFiltered

}

