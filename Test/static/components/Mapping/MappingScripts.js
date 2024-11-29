class Mapping {
    constructor(container) {
        this.data = [];
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.padding = 20;
        
        this.initializeSVG();
        this.initializeScales();
        this.draw();
        this.updatePoseData();
        this.updateInterval = setInterval(() => this.updatePoseData(), 100); // 10 times per second
    }

    initializeSVG() {
        const minDimension = Math.min(this.container.clientWidth, this.container.clientHeight);
        this.width = minDimension;
        this.height = minDimension;
        
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${this.width + this.padding} ${this.height + this.padding}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
    }

    initializeScales() {
        const maxVal = Math.max(
            d3.max(this.data, d => d.x),
            d3.max(this.data, d => d.y)
        );
        const minVal = Math.min(
            d3.min(this.data, d => d.x),
            d3.min(this.data, d => d.y)
        );

        this.x = d3.scaleLinear()
            .range([this.padding, this.width - this.padding])
            .domain([minVal, maxVal]);

        this.y = d3.scaleLinear()
            .range([this.height - this.padding, this.padding])
            .domain([minVal, maxVal]);
    }

    updatePoseData() {
        fetch('/pose')
            .then(response => response.json())
            .then(data => {
                if (data.position) {
                    this.addPoint(data.position.x, data.position.y);
                }
            })
            .catch(error => console.error('Error fetching pose data:', error));
    }

    addPoint(x, y) {
        if (typeof x === 'undefined' || typeof y === 'undefined') {return;}
        this.data.push({ x, y });
        this.updateMap();
    }

    updateMap() {
        // Find the maximum absolute value among all x and y coordinates
        const maxVal = Math.max(
            d3.max(this.data, d => d.x),
            d3.max(this.data, d => d.y)
        );
        const minVal = Math.min(
            d3.min(this.data, d => d.x),
            d3.min(this.data, d => d.y)
        );

        // Update scales with symmetric domains
        this.x.domain([minVal, maxVal]);
        this.y.domain([minVal, maxVal]);

        // Update dots
        const dots = this.svg.selectAll('.dot')
            .data(this.data);

        dots.enter().append('circle')
            .attr('class', 'dot')
            .attr('r', 5)
            .merge(dots)
            .attr('cx', d => this.x(d.x) + this.padding / 2)
            .attr('cy', d => this.y(d.y) + this.padding / 2)
            .style('fill', 'steelblue');

        dots.exit().remove();

        // Update lines
        const lines = this.data.slice(0, -1).map((d, i) => ({
            x: [d.x, this.data[i + 1].x],
            y: [d.y, this.data[i + 1].y]
        }));

        const lineSelection = this.svg.selectAll('.line')
            .data(lines);

        lineSelection.enter().append('line')
            .attr('class', 'line')
            .merge(lineSelection)
            .attr('x1', d => this.x(d.x[0]) + this.padding / 2)
            .attr('y1', d => this.y(d.y[0]) + this.padding / 2)
            .attr('x2', d => this.x(d.x[1]) + this.padding / 2)
            .attr('y2', d => this.y(d.y[1]) + this.padding / 2)
            .style('stroke', 'steelblue')
            .style('stroke-width', 2);

        lineSelection.exit().remove();
    }

    draw() {
        this.updateMap();
    }

    cleanup() {
        clearInterval(this.updateInterval);
        // Kill ROS scripts first
        fetch('/kill_mapping_scripts', {
            method: 'POST',
        })
        .then(response => response.json())
        .catch(error => console.error('Error killing ROS scripts:', error));

        // Original cleanup code
        if (this.svg) {
            this.svg.selectAll('*').remove();
            this.svg.remove();
        }
        
        this.data = [];
        this.svg = null;
        this.x = null;
        this.y = null;
        
        this.container.innerHTML = '';
    }

    destroy() {
        this.cleanup();
    }
}

// Export for use in other files
window.Mapping = Mapping;