/* ============================================= */
/* PositionMonitor Class Definition */
/* ============================================= */

class PositionMonitor {
    constructor(container) {
        this.container = container;
        this.abortController = new AbortController();
        this.render();
    }

    /* ============================================= */
    /* Component Rendering */
    /* ============================================= */

    render() {
        this.container.innerHTML = `
            <div class="monitor-panel">
                <h2>Position: odometry</h2>
                <div class="value-row">
                    <span class="value-label">X:</span>
                    <span class="value" id="position-x">0.000</span>
                </div>
                <div class="value-row">
                    <span class="value-label">Y:</span>
                    <span class="value" id="position-y">0.000</span>
                </div>
                <h2>Position: fusion</h2>
                <div class="value-row">
                    <span class="value-label">X:</span>
                    <span class="value" id="position-x-fusion">0.000</span>
                </div>
                <div class="value-row">
                    <span class="value-label">Y:</span>
                    <span class="value" id="position-y-fusion">0.000</span>
                </div>
            </div>
            <div class="error-message" id="position-error">
                <span class="value-label">ERROR: Failed to fetch position data</span>
            </div>
        `;

        this.updatePosition();
        this.updateInterval = setInterval(() => this.updatePosition(), 100);
        this.updateScaling();
    }

    showError(show) {
        const errorElement = document.getElementById('position-error');
        if (errorElement) {
            errorElement.style.display = show ? 'block' : 'none';
        }
    }

    /* ============================================= */
    /* Data Update Functions */
    /* ============================================= */

    // Fetch pose data from the server and update the displayed values
    updatePosition() {
        // First check if processes are running
        fetch('/check_processes_pos', {
            signal: this.abortController.signal
        })
            .then(response => response.json())
            .then(processes => {
                if (!processes.rpm_processor || !processes.odometry) {
                    this.showError(false);
                    return;
                } else {
                    this.showError(false);
                    return fetch('/get_pose', {
                        signal: this.abortController.signal
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.position) {
                                document.getElementById('position-x').textContent = data.position.x.toFixed(3);
                                document.getElementById('position-y').textContent = data.position.y.toFixed(3);
                            }
                        });
                }
            })
            .catch(error => {
                return;
            });
        fetch('/check_processes_pos', {
            signal: this.abortController.signal
        })
            .then(response => response.json())
            .then(processes => {
                if (!processes.rpm_processor || !processes.odometry) {
                    this.showError(false);
                    return;
                } else {
                    this.showError(false);
                    return fetch('/get_pose_fusion', {
                        signal: this.abortController.signal
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.position) {
                                document.getElementById('position-x-fusion').textContent = data.position.x.toFixed(3);
                                document.getElementById('position-y-fusion').textContent = data.position.y.toFixed(3);
                            }
                        });
                }
            })
            .catch(error => {
                return;
            });
    }

    /* ============================================= */
    /* Layout Scaling */
    /* ============================================= */

    // Update component scaling based on the number of content areas
    updateScaling() {
        const count = document.querySelectorAll(".content-area").length;
        let scaleFactor;

        switch (count) {
            case 1: scaleFactor = 1; break;
            case 2: scaleFactor = 1.1; break;
            case 3: scaleFactor = 1.4; break;
            case 4: scaleFactor = 2.3; break;
            default: scaleFactor = 1; break;
        }

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

    // Clean up ROS scripts and intervals
    cleanup() {
        // Abort any pending fetch operations
        this.abortController.abort();
        
        // Clear update interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // Hide error message
        this.showError(false);

        // Kill ROS scripts with proper error handling
        fetch('/kill_pos_scripts', {
            method: 'POST',
        })
        .then(response => response.json())
        .catch(error => console.error('Error killing ROS scripts:', error));

        // Clear DOM content and references
        this.container.innerHTML = '';
    }

    destroy() {
        this.cleanup();
    }
}
