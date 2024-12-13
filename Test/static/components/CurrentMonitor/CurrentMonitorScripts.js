/* ============================================= */
/* CurrentMonitor Class Definition */
/* ============================================= */

class CurrentMonitor {
    constructor(container) {
        this.container = container;
        this.render();
    }

    /* ============================================= */
    /* Component Rendering */
    /* ============================================= */

    render() {
        this.container.innerHTML = `
            <div class="monitor-panel">
                <h2>Current Draw</h2>
                <div class="value-row">
                    <span class="value-label">Amps:</span>
                    <span class="value" id="current-value">0.000</span>
                </div>
            </div>
        `;

        this.updateCurrent();
        this.updateInterval = setInterval(() => this.updateCurrent(), 1000);
        this.updateScaling();
    }

    /* ============================================= */
    /* Data Update Functions */
    /* ============================================= */

    updateCurrent() {
        fetch('/get_current')
            .then(response => response.json())
            .then(data => {
                document.getElementById('current-value').textContent = (data.current + 80.0).toFixed(3);
            });
    }

    /* ============================================= */
    /* Layout Scaling */
    /* ============================================= */

    updateScaling() {
        const count = document.querySelectorAll(".content-area").length;
        let scaleFactor;

        switch (count) {
            case 1: scaleFactor = 1; break;
            case 2: scaleFactor = 1.1; break;
            case 3: scaleFactor = 1.4; break;
            case 4: scaleFactor = 1.7; break;
            default: scaleFactor = 1; break;
        }

        document.documentElement.style.setProperty(
            "--monitor-padding",
            `min(${2 / scaleFactor}vh, ${2 / scaleFactor}vw)`
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
