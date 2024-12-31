/* ============================================= */
/* Example Class Definition */
/* ============================================= */

class Example {
	constructor(container) {
		this.container = container;
		this.render();
	}

	render() {
		this.container.innerHTML = `
            <div class="example">
                <h3>Example title</h3>
            </div>`;
	}

	destroy() {
		this.container.innerHTML = "";
	}
}