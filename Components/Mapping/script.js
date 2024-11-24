// script.js
const data = [
    { x: 0, y: 0 }
];

function numberAdded() {
    var x = Math.floor(Math.random() * 100);
    var y = Math.floor(Math.random() * 100);
    console.log(x, y);
    data.push({ x: x, y: y });
    updateMap();
}

// Set up the SVG container
const container = document.querySelector('.maping');
const width = container.clientWidth;
const height = container.clientHeight;
const padding = 20; // Adjust this value to change the padding

const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width + 2 * padding} ${height + 2 * padding}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

// Update the scales when the window is resized
window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    svg.attr('viewBox', `0 0 ${newWidth + 2 * padding} ${newHeight + 2 * padding}`);
    x.range([padding, newWidth - padding]);
    y.range([newHeight - padding, padding]);
    svg.selectAll('.dot')
        .attr('cx', d => x(d.x) + padding / 2)
        .attr('cy', d => y(d.y) + padding / 2);
    svg.selectAll('.line')
        .attr('x1', d => x(d.x[0]) + padding / 2)
        .attr('y1', d => y(d.y[0]) + padding / 2)
        .attr('x2', d => x(d.x[1]) + padding / 2)
        .attr('y2', d => y(d.y[1]) + padding / 2);
});

// Create the scales
const x = d3.scaleLinear()
    .range([padding, width - padding])
    .domain(d3.extent(data, d => d.x));

const y = d3.scaleLinear()
    .range([height - padding, padding])
    .domain(d3.extent(data, d => d.y));

// Draw the scatter plot
svg.selectAll('.dot')
    .data(data)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('r', 5)
    .attr('cx', d => x(d.x) + padding / 2)
    .attr('cy', d => y(d.y) + padding / 2)
    .style('fill', 'steelblue');

// Draw the lines
const lines = [];
for (let i = 0; i < data.length - 1; i++) {
    lines.push({
        x: [data[i].x, data[i + 1].x],
        y: [data[i].y, data[i + 1].y]
    });
}

svg.selectAll('.line')
    .data(lines)
    .enter().append('line')
    .attr('class', 'line')
    .attr('x1', d => x(d.x[0]) + padding / 2)
    .attr('y1', d => y(d.y[0]) + padding / 2)
    .attr('x2', d => x(d.x[1]) + padding / 2)
    .attr('y2', d => y(d.y[1]) + padding / 2)
    .style('stroke', 'steelblue')
    .style('stroke-width', 2);

function updateMap() {
    // Update the scales
    x.domain(d3.extent(data, d => d.x));
    y.domain(d3.extent(data, d => d.y));

    // Update the dots
    const dots = svg.selectAll('.dot')
        .data(data);

    dots.enter().append('circle')
        .attr('class', 'dot')
        .attr('r', 5)
        .merge(dots)
        .attr('cx', d => x(d.x) + padding / 2)
        .attr('cy', d => y(d.y) + padding / 2)
        .style('fill', 'steelblue');

    dots.exit().remove();

    // Update the lines
    const lines = [];
    for (let i = 0; i < data.length - 1; i++) {
        lines.push({
            x: [data[i].x, data[i + 1].x],
            y: [data[i].y, data[i + 1].y]
        });
    }

    const lineSelection = svg.selectAll('.line')
        .data(lines);

    lineSelection.enter().append('line')
        .attr('class', 'line')
        .merge(lineSelection)
        .attr('x1', d => x(d.x[0]) + padding / 2)
        .attr('y1', d => y(d.y[0]) + padding / 2)
        .attr('x2', d => x(d.x[1]) + padding / 2)
        .attr('y2', d => y(d.y[1]) + padding / 2)
        .style('stroke', 'steelblue')
        .style('stroke-width', 2);

    lineSelection.exit().remove();
}