class Mapping {
    constructor(container) {
        this.data = [{ x: 0, y: 0 }];
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.padding = 20;
        
        this.initializeSVG();
        this.initializeScales();
        this.draw();
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
        this.x = d3.scaleLinear()
            .range([this.padding, this.width - this.padding])
            .domain(d3.extent(this.data, d => d.x));

        this.y = d3.scaleLinear()
            .range([this.height - this.padding, this.padding])
            .domain(d3.extent(this.data, d => d.y));
    }

    addPoint() {
        const x = Math.floor(Math.random() * 100);
        const y = Math.floor(Math.random() * 100);
        this.data.push({ x, y });
        this.updateMap();
    }

    updateMap() {
        this.x.domain(d3.extent(this.data, d => d.x));
        this.y.domain(d3.extent(this.data, d => d.y));

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
        // Remove all SVG elements
        if (this.svg) {
            this.svg.selectAll('*').remove();
            this.svg.remove();
        }
        
        // Clear data and references
        this.data = [];
        this.svg = null;
        this.x = null;
        this.y = null;
        
        // Clear container
        this.container.innerHTML = '';
    }

    destroy() {
        this.cleanup();
    }
}

// Export for use in other files
window.Mapping = Mapping;