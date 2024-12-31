/* ============================================= */
/* Global Variables */
/* ============================================= */

const layoutContainer = document.getElementById('layoutContainer');
const buttons = document.querySelectorAll('.layout-button');
const contentMenu = document.getElementById('contentMenu');
let activeContentArea = null;
let activeComponents = [];

/* ============================================= */
/* Context Menu Functions */
/* ============================================= */

// Show context menu when content area is clicked
function showContentMenu(e, contentArea) {
    e.preventDefault();
    activeContentArea = contentArea;
    
    contentMenu.style.display = 'block';
    contentMenu.style.left = `${e.pageX}px`;
    contentMenu.style.top = `${e.pageY}px`;
}

/* ============================================= */
/* Layout Management */
/* ============================================= */

// Destroys all components in a layout (in all content areas) if they have a destroy() method
// Ensures that components are properly cleaned up when switching layouts
function destroyComponents() {
    activeComponents.forEach(component => {
        if (component && typeof component.destroy === 'function') {
            component.destroy();
        }
    });
    activeComponents = [];
}

// Initializes a content area with a click event listener to show the content menu
function initializeContentArea(contentArea) {
    contentArea.addEventListener('click', (e) => showContentMenu(e, contentArea));
}

// Creates a layout with a specified number of content areas
function createLayout(numDivs) {
    // Destroy existing components and clear layout container
    destroyComponents();

    layoutContainer.innerHTML = '';
    layoutContainer.className = 'layout-container';
    layoutContainer.classList.add(`layout-${numDivs}`);

    // Create i content areas
    for (let i = 1; i <= numDivs; i++) {
        const div = document.createElement('div');
        div.className = 'content-area';
        div.innerHTML = `<p>Add component</p>`;
        initializeContentArea(div);
        layoutContainer.appendChild(div);
    }
    
    // Update scaling for any components by calling their respective updateScaling() methods
    const componentsToUpdate = [ControlPanel, Instructions, SpeedMonitor, PositionMonitor, CurrentMonitor /*ADD: Add more components here*/];
    document.querySelectorAll('.content-area').forEach(area => {
        if (area._component && componentsToUpdate.some(comp => area._component instanceof comp)) {
            area._component.updateScaling();
        }
    });
}

// Initialize existing content areas when page loads
document.addEventListener('DOMContentLoaded', () => {
    const existingContentAreas = document.querySelectorAll('.content-area');
    existingContentAreas.forEach(area => initializeContentArea(area));
});

/* ============================================= */
/* Event Listeners */
/* ============================================= */

// Menu item selection
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        if (activeContentArea) {
            // Clean up previous content if it has a destroy method
            if (activeContentArea._component && typeof activeContentArea._component.destroy === 'function') {
                activeContentArea._component.destroy();
            }

            // Remove previous component from activeComponents
            activeComponents = activeComponents.filter(component => component !== activeContentArea._component);
            
            // Depending on the clicked content type, create a new component in the content area
            const contentType = item.dataset.content;
            if (contentType === 'Mapping') {
                // Create a mapping div
                activeContentArea.innerHTML = '';
                const mapDiv = document.createElement('div');
                mapDiv.className = 'mapping';
                activeContentArea.appendChild(mapDiv);
                
                // Clear content area and Create a mapping instance
                const mapping = new Mapping(mapDiv);
                activeContentArea._component = mapping;
                activeComponents.push(mapping);
                
                // Launch relevant ROS2 scripts, if not already running
                if (!activeComponents.some(component => component instanceof PositionMonitor)) {
                    launchROS2Command('ros2 launch walter_robot odometry_launch.py');
                }
            } else if (contentType === 'ControlPanel') {
                activeContentArea.innerHTML = '';
                const controlPanel = new ControlPanel(activeContentArea);
                activeContentArea._component = controlPanel;
                activeComponents.push(controlPanel);
            } else if (contentType === 'Instructions') {
                activeContentArea.innerHTML = '';
                const instructions = new Instructions(activeContentArea);
                activeContentArea._component = instructions;
                activeComponents.push(instructions);
            } else if (contentType === 'SpeedMonitor') {
                activeContentArea.innerHTML = '';
                const speedMonitor = new SpeedMonitor(activeContentArea);
                activeContentArea._component = speedMonitor;
                activeComponents.push(speedMonitor);
            } else if (contentType === 'PositionMonitor') {
                activeContentArea.innerHTML = '';
                const positionMonitor = new PositionMonitor(activeContentArea);
                activeContentArea._component = positionMonitor;
                activeComponents.push(positionMonitor);

                // Launch relevant ROS2 scripts, if not already running
                if (!activeComponents.some(component => component instanceof Mapping)) {
                    launchROS2Command('ros2 launch walter_robot sensors_fusion_launch.py');
                }
            } else if (contentType === 'CurrentMonitor') {
                activeContentArea.innerHTML = '';
                const currentMonitor = new CurrentMonitor(activeContentArea);
                activeContentArea._component = currentMonitor;
                activeComponents.push(currentMonitor);
            /* ADD: Add more content types here */
            } else {
                if (activeContentArea._component) {
                    delete activeContentArea._component;
                }
                activeContentArea.innerHTML = `<p>${contentType} Content</p>`;
            }
            contentMenu.style.display = 'none';
        }
    });
});

// Close context menu on outside click
document.addEventListener('click', (e) => {
    if (!contentMenu.contains(e.target) && !e.target.classList.contains('content-area')) {
        contentMenu.style.display = 'none';
    }
});

// Layout button handlers
buttons.forEach(button => {
    button.addEventListener('click', () => {
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const numDivs = parseInt(button.dataset.layout);
        createLayout(numDivs);
    });
});

// Destroy components on window/tab close
window.addEventListener('beforeunload', destroyComponents);
