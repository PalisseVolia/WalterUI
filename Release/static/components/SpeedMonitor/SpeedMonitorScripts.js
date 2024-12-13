/* ============================================= */
/* SpeedMonitor Class Definition */
/* ============================================= */

class SpeedMonitor {
	constructor(container) {
		this.container = container;
		this.render();
	}

	/* ============================================= */
	/* Component Rendering */
	/* ============================================= */

	// Render html content for the SpeedMonitor component
	render() {
		this.container.innerHTML = `
            <div class="monitor-panel">
                <div class="velocity-box">
                    <h2>Linear Velocity</h2>
                    <div class="value-row">
                        <span class="value-label">X:</span>
                        <span class="value" id="linear-x">0.000</span>
                    </div>
                    <div class="value-row">
                        <span class="value-label">Y:</span>
                        <span class="value" id="linear-y">0.000</span>
                    </div>
                    <div class="value-row">
                        <span class="value-label">Z:</span>
                        <span class="value" id="linear-z">0.000</span>
                    </div>
                </div>

                <div class="velocity-box">
                    <h2>Angular Velocity</h2>
                    <div class="value-row">
                        <span class="value-label">X:</span>
                        <span class="value" id="angular-x">0.000</span>
                    </div>
                    <div class="value-row">
                        <span class="value-label">Y:</span>
                        <span class="value" id="angular-y">0.000</span>
                    </div>
                    <div class="value-row">
                        <span class="value-label">Z:</span>
                        <span class="value" id="angular-z">0.000</span>
                    </div>
                </div>
            </div>
        `;

		// Update displayed data
		this.updateTwist();
		this.updateInterval = setInterval(() => this.updateTwist(), 1000);
		this.updateScaling();
	}

	/* ============================================= */
	/* Data Update Functions */
	/* ============================================= */

	// Fetch cmd_vel topic data from the server and update the displayed values
	updateTwist() {
		fetch('/get_cmd_vel')
			.then(response => response.json())
			.then(data => {
				// Update linear velocities
				document.getElementById('linear-x').textContent = data.linear.x.toFixed(3);
				document.getElementById('linear-y').textContent = data.linear.y.toFixed(3);
				document.getElementById('linear-z').textContent = data.linear.z.toFixed(3);

				// Update angular velocities
				document.getElementById('angular-x').textContent = data.angular.x.toFixed(3);
				document.getElementById('angular-y').textContent = data.angular.y.toFixed(3);
				document.getElementById('angular-z').textContent = data.angular.z.toFixed(3);
			});
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
				scaleFactor = 1.1;
				break;
			case 3:
				scaleFactor = 1.4;
				break;
			case 4:
				scaleFactor = 2.3;
				break;
			default:
				scaleFactor = 1;
				break;
		}

		// Update CSS variables
		document.documentElement.style.setProperty(
			"--monitor-padding",
			`min(${2 / scaleFactor}vh, ${2 / scaleFactor}vw)`
		);
		document.documentElement.style.setProperty(
			"--monitor-gap",
			`min(${1 / scaleFactor}vh, ${1 / scaleFactor}vw)`
		);
		document.documentElement.style.setProperty(
			"--monitor-font-size-h2",
			`min(${5 / scaleFactor}vh, ${5 / scaleFactor}vw)`
		);
		document.documentElement.style.setProperty(
			"--monitor-font-size",
			`min(${2.5 / scaleFactor}vh, ${2.5 / scaleFactor}vw)`
		);
	}

	/* ============================================= */
	/* Cleanup */
	/* ============================================= */

	destroy() {
		clearInterval(this.updateInterval);
	}
}
