/* ============================================= */
/* Instructions Class Definition */
/* ============================================= */

class Instructions {
	constructor(container) {
		this.container = container;
		this.updateScaling();
		this.render();
	}

	/* ============================================= */
	/* Component Rendering */
	/* ============================================= */

	// Render html content for the Instructions component
	render() {
		this.container.innerHTML = `
            <div class="instructions">
                <h3>Keyboard Controls:</h3>
                <p><span class="key-binding">↑</span> or <span class="key-binding">z</span>: Forward</p>
                <p><span class="key-binding">←</span> or <span class="key-binding">q</span>: Rotate Left</p>
                <p><span class="key-binding">→</span> or <span class="key-binding">d</span>: Rotate Right</p>
                <p><span class="key-binding">↓</span> or <span class="key-binding">s</span>: Backward</p>
                <p><span class="key-binding">space</span>: Stop</p>
            </div>`;
	}

	/* ============================================= */
	/* Layout Scaling */
	/* ============================================= */

	updateScaling() {
		const count = document.querySelectorAll(".content-area").length;
		let scaleFactor;

		// set scale factor based on number of content areas
		switch (count) {
			case 1:
				scaleFactor = 1;
				break;
			case 2:
				scaleFactor = 1.25;
				break;
			case 3:
				scaleFactor = 1.4;
				break;
			case 4:
				scaleFactor = 1.7;
				break;
			default:
				scaleFactor = 1;
		}

		// Update CSS variables
		document.documentElement.style.setProperty(
			"--instructions-padding",
			`min(${10 / scaleFactor}vh, ${10 / scaleFactor}vw)`
		);
		document.documentElement.style.setProperty(
			"--instructions-width",
			`min(${80 / scaleFactor}vh, ${80 / scaleFactor}vw)`
		);
		document.documentElement.style.setProperty(
			"--instructions-title-size",
			`min(${4 / scaleFactor}vh, ${4 / scaleFactor}vw)`
		);
		document.documentElement.style.setProperty(
			"--instructions-text-size",
			`min(${2.5 / scaleFactor}vh, ${2.5 / scaleFactor}vw)`
		);
		document.documentElement.style.setProperty(
			"--instructions-spacing",
			`min(${1 / scaleFactor}vh, ${1 / scaleFactor}vw)`
		);
		document.documentElement.style.setProperty(
			"--instructions-gap",
			`min(${1 / scaleFactor}vh, ${1 / scaleFactor}vw)`
		);
	}


	/* ============================================= */
	/* Cleanup */
	/* ============================================= */

	destroy() {
		this.container.innerHTML = "";
	}
}
