class PlayVis {

    constructor(_parentElement, _data, _teamAbbr, _plays, _testPlay) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.play = _plays;
        this.teams = _teamAbbr;
        this.testPlay = _testPlay;
        this.currentFrame = 1;
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 40, right: 0, bottom: 60, left: 60};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 300 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Numbers are from the standard length of a football field :)
        vis.xScale = d3.scaleLinear()
            .domain([0, 120]) // 0 to 120 yards for x-axis
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .domain([0, 53.3]) // 0 to 53.3 yards for y-axis
            .range([0, vis.height]);
        vis.wrangleData();
    }

    updateVis() {
        let vis = this;

        // Draw the field
        vis.svg.append('rect')
            .attr('x', vis.xScale(0))
            .attr('y', vis.yScale(0))
            .attr('width', vis.xScale(120))
            .attr('height', vis.yScale(53.3))
            .attr('fill', '#828c23');

        // Draw the end zones
        vis.svg.append('rect')
            .attr('x', vis.xScale(0))
            .attr('y', vis.yScale(0))
            .attr('width', vis.xScale(10)) // End zones are 10 yards deep
            .attr('height', vis.yScale(53.3))
            .attr('fill', '#1B4079');

        vis.svg.append('rect')
            .attr('x', vis.xScale(110)) // Start at 110 yards for the other end zone
            .attr('y', vis.yScale(0))
            .attr('width', vis.xScale(10))
            .attr('height', vis.yScale(53.3))
            .attr('fill', '#1B4079');

        // Draw yard lines
        for (let i = 10; i <= 110; i += 10) {
            vis.svg.append('line')
                .attr('x1', vis.xScale(i))
                .attr('y1', vis.yScale(0))
                .attr('x2', vis.xScale(i))
                .attr('y2', vis.yScale(53.3))
                .attr('stroke', 'white')
                .attr('stroke-width', 2);
        }

        for (let i = 10; i <= 110; i += 10) {
            vis.svg.append('text')
                .attr('x', vis.xScale(i))
                .attr('y', vis.yScale(53.3 / 2)) // Position at the middle of the field
                .attr('fill', 'white')
                .attr('text-anchor', 'middle')
                .text(`${i}`);
        }


        // Draw a circle for each unique ID
        vis.uniqueIds.forEach(nflId => {
            // Find the initial position for each ID
            let initialPos = vis.testPlay.find(d => d.nflId === nflId && d.frameId === 1);
            console.log(initialPos)
            vis.svg.append('circle')
                .attr('cx', vis.xScale(initialPos.x))
                .attr('cy', vis.yScale(initialPos.y))
                .attr('r', 5)
                .attr('fill', nflId === 1 ? 'brown' : 'red')
                .attr('class', 'player-circle')
                .attr('id', `player-${nflId}`)
                .attr('dy', ".35em")  // Vertically center text
                .attr('text-anchor', 'middle')  // Center text horizontally
                .text(nflId.jerseyNumber)
                .attr('data-nflid', nflId);
                //
                // let jerseyNumber = initialPos.jerseyNumber; // Replace with the actual property if different
                // vis.svg.append('text')
                //     .attr('x', vis.xScale(initialPos.x))
                //     .attr('y', vis.yScale(initialPos.y))
                //     .attr('dy', ".35em") // This adjusts the position to vertically align the text
                //     .attr('text-anchor', 'middle') // This centers the text horizontally on the x coordinate
                //     .text(jerseyNumber) // Set the text to the jersey number
                //     .attr('class', 'jersey-text')
                //     .attr('id', `jersey-${nflId}`);
        });
    }

    wrangleData(teamAbbr) {
        let vis = this

        // Map each team to its game IDs
        let gamesTeam = vis.teams.map(team => {
            let gameIds = vis.data.filter(game =>
                game.homeTeamAbbr === team || game.visitorTeamAbbr === team
            ).map(game => game.gameId);
            return [team, gameIds];
        });

        vis.testPlay = vis.testPlay.map(d => {
            return {
                ...d,
                frameId: +d.frameId,
                nflId: +d.nflId,
            };
        });

        vis.uniqueIds = new Set(vis.testPlay.map(d => d.nflId));
        vis.updateVis();
    }

    updatePlayersPosition(frameIndex) {
        let vis = this;

        // Assuming each row in your CSV represents a player's position in a single frame
        let frameData = vis.testPlay.filter(d => d.frameId === frameIndex);

        let clubs = [...new Set(frameData.map(d => d.club))];

        frameData.forEach(playerData => {
            // Change color based on first or second club
            let color;
            if (clubs[0] === playerData.club) {
                color = 'blue';
            } else if (clubs[1] === playerData.club) {
                color = 'orange';
            } else {
                color = 'grey';
            }

            // Update each player's position
            d3.select(`#player-${playerData.nflId}`)
                .transition()
                .duration(900)
                .attr('cx', vis.xScale(playerData.x))
                .attr('cy', vis.yScale(playerData.y))
                .attr('r', 5)
                .attr('fill', color) // Use the determined color
                .attr('class', 'player-circle')
                .attr('id', `player-${playerData.nflId}`)
                .attr('data-nflid', playerData.nflId);
        });
    }

    updateVisualization(playData) {
        let vis = this;

        // Clear existing SVG elements
        vis.svg.selectAll("*").remove();

        // Process new data or filter existing data based on the selected play
        // For example, if 'selectedPlay' is an ID, filter 'vis.testPlay' to get relevant data
        vis.testPlay = playData;
        vis.wrangleData()
    };
}