/* ============================================= */
/* Global Variables */
/* ============================================= */

const layoutContainer = document.getElementById('layoutContainer');
const buttons = document.querySelectorAll('.layout-button');
const contentMenu = document.getElementById('contentMenu');
let activeContentArea = null;

/* ============================================= */
/* Context Menu Functions */
/* ============================================= */

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

function initializeContentArea(contentArea) {
    contentArea.addEventListener('click', (e) => showContentMenu(e, contentArea));
}

function createLayout(numDivs) {
    layoutContainer.innerHTML = '';
    layoutContainer.className = 'layout-container';
    layoutContainer.classList.add(`layout-${numDivs}`);

    for (let i = 1; i <= numDivs; i++) {
        const div = document.createElement('div');
        div.className = 'content-area';
        div.innerHTML = `<p>Content Area ${i}</p>`;
        initializeContentArea(div);
        layoutContainer.appendChild(div);
    }
    
    // Update scaling for any existing control panels
    document.querySelectorAll('.content-area').forEach(area => {
        if (area._component instanceof ControlPanel) {
            area._component.updateControlScaling();
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
            
            const contentType = item.dataset.content;
            if (contentType === 'Mapping') {
                // Clear content area and create mapping div
                activeContentArea.innerHTML = '';
                const mapDiv = document.createElement('div');
                mapDiv.className = 'mapping';
                activeContentArea.appendChild(mapDiv);
                
                // Create mapping instance
                const mapping = new Mapping(mapDiv);
                activeContentArea._component = mapping;
                
                // Add button for adding points TODO: Remove when adding points is implemented
                const addButton = document.createElement('button');
                addButton.textContent = 'Add Point';
                addButton.style.position = 'absolute';
                addButton.style.top = '10px';
                addButton.style.left = '10px';
                addButton.style.zIndex = '1000';
                addButton.onclick = () => mapping.addPoint();
                activeContentArea.appendChild(addButton);
            } else if (contentType === 'ControlPanel') {
                // Clear content area and initialize control panel
                activeContentArea.innerHTML = '';
                const controlPanel = new ControlPanel(activeContentArea);
                activeContentArea._component = controlPanel;
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

// Close menu on outside click
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
