/**
 * DSA Canvas Visualizer - Teaching Tool
 * A canvas-based application for visualizing Data Structures & Algorithms
 * 
 * Architecture:
 * - Stage: Main Konva stage (canvas)
 * - Layers: UI elements organized by layer
 * - ArrayVisualizer: Manages array drawing and interactions
 * - Pointers: Manages pointer labels (i, j, low, high, etc.)
 * - Highlights: Manages cell highlighting with colors
 * - Text Annotations: Manages text labels on canvas
 */

// ============================================================================
// INITIALIZATION & STAGE SETUP
// ============================================================================

let stage, mainLayer, textLayer, pointerLayer;
let arrayVisualizer = null;
let currentMode = null;
let selectedColor = '#FFD700';

/**
 * Initialize the Konva stage and layers
 */
function initializeStage() {
    const container = document.getElementById('konva-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create main stage
    stage = new Konva.Stage({
        container: 'konva-container',
        width: width,
        height: height,
        draggable: false
    });

    // Create layers (ordered from bottom to top)
    mainLayer = new Konva.Layer();
    textLayer = new Konva.Layer();
    pointerLayer = new Konva.Layer();

    stage.add(mainLayer, textLayer, pointerLayer);

    // Handle window resize
    window.addEventListener('resize', () => {
        stage.width(container.clientWidth);
        stage.height(container.clientHeight);
    });
}

// ============================================================================
// ARRAY VISUALIZER - Core Component
// ============================================================================

/**
 * ArrayVisualizer class: Manages array creation, drawing, and interactions
 */
class ArrayVisualizer {
    constructor(size, layer) {
        this.size = size;
        this.layer = layer;
        this.cells = [];
        this.values = new Array(size).fill('');
        this.highlights = new Array(size).fill(null);
        this.cellWidth = 80;
        this.cellHeight = 60;
        this.indexHeight = 30;
        this.startX = 100;
        this.startY = 150;
        this.cellSpacing = 10;
        this.group = new Konva.Group({
            x: 0,
            y: 0
        });

        this.draw();
    }

    /**
     * Draw the entire array structure on canvas
     * Structure: Index row + Cell row
     */
    draw() {
        this.layer.destroyChildren();
        this.cells = [];

        // Draw index numbers above cells
        for (let i = 0; i < this.size; i++) {
            const indexX = this.startX + i * (this.cellWidth + this.cellSpacing) + this.cellWidth / 2;
            const indexY = this.startY - this.indexHeight;

            const indexText = new Konva.Text({
                x: indexX - 15,
                y: indexY,
                text: i.toString(),
                fontSize: 14,
                fontFamily: 'Arial',
                fill: '#333',
                fontStyle: 'bold'
            });
            this.layer.add(indexText);
        }

        // Draw "Index:" label
        const indexLabel = new Konva.Text({
            x: this.startX - 90,
            y: this.startY - this.indexHeight,
            text: 'Index:',
            fontSize: 14,
            fontFamily: 'Arial',
            fill: '#666',
            fontStyle: 'bold'
        });
        this.layer.add(indexLabel);

        // Draw cells
        for (let i = 0; i < this.size; i++) {
            const cellX = this.startX + i * (this.cellWidth + this.cellSpacing);
            const cellY = this.startY;

            // Cell rectangle
            const cellRect = new Konva.Rect({
                x: cellX,
                y: cellY,
                width: this.cellWidth,
                height: this.cellHeight,
                fill: '#FFFFFF',
                stroke: '#333',
                strokeWidth: 2,
                cornerRadius: 4,
                index: i
            });

            // Cell value text
            const valueText = new Konva.Text({
                x: cellX,
                y: cellY + this.cellHeight / 2 - 10,
                width: this.cellWidth,
                text: this.values[i],
                fontSize: 16,
                fontFamily: 'Arial, monospace',
                fill: '#000',
                align: 'center',
                verticalAlign: 'middle',
                index: i
            });

            // Interactive group for each cell
            const cellGroup = new Konva.Group({
                x: 0,
                y: 0,
                index: i,
                draggable: false
            });

            cellGroup.add(cellRect, valueText);

            // Mouse events
            cellGroup.on('click', () => this.onCellClick(i));
            cellGroup.on('mouseenter', () => {
                cellRect.fill('#F0F0F0');
                this.layer.batchDraw();
                this.showInfo(`Cell [${i}] = ${this.values[i]}`);
            });
            cellGroup.on('mouseleave', () => {
                if (!this.highlights[i]) {
                    cellRect.fill('#FFFFFF');
                }
                this.layer.batchDraw();
                this.hideInfo();
            });

            this.layer.add(cellGroup);
            this.cells.push({
                group: cellGroup,
                rect: cellRect,
                text: valueText,
                index: i
            });
        }

        // Draw "Value:" label
        const valueLabel = new Konva.Text({
            x: this.startX - 90,
            y: this.startY + this.cellHeight / 2 - 10,
            text: 'Value:',
            fontSize: 14,
            fontFamily: 'Arial',
            fill: '#666',
            fontStyle: 'bold'
        });
        this.layer.add(valueLabel);

        this.layer.draw();
    }

    /**
     * Handle cell click - allow editing value
     */
    onCellClick(index) {
        if (currentMode === 'highlight') {
            // In highlight mode, show highlight modal with this index
            showHighlightModal(index);
            return;
        }

        // Prompt for value
        const currentValue = this.values[index];
        const newValue = prompt(`Enter value for cell [${index}]:`, currentValue);

        if (newValue !== null) {
            this.updateCellValue(index, newValue);
        }
    }

    /**
     * Update a cell's value and redraw
     */
    updateCellValue(index, value) {
        if (index >= 0 && index < this.size) {
            this.values[index] = value;
            this.cells[index].text.text(value);
            this.layer.draw();
        }
    }

    /**
     * Highlight a cell with a specific color
     */
    highlightCell(index, color) {
        if (index >= 0 && index < this.size) {
            this.highlights[index] = color;
            this.cells[index].rect.fill(color);
            this.layer.draw();
        }
    }

    /**
     * Clear highlight from a specific cell or all cells
     */
    clearHighlight(index = null) {
        if (index === null) {
            // Clear all
            for (let i = 0; i < this.size; i++) {
                this.highlights[i] = null;
                this.cells[i].rect.fill('#FFFFFF');
            }
        } else if (index >= 0 && index < this.size) {
            this.highlights[index] = null;
            this.cells[index].rect.fill('#FFFFFF');
        }
        this.layer.draw();
    }

    /**
     * Get cell position for pointer placement
     */
    getCellPosition(index) {
        if (index >= 0 && index < this.size) {
            const cellX = this.startX + index * (this.cellWidth + this.cellSpacing);
            const cellY = this.startY;
            return {
                x: cellX + this.cellWidth / 2,
                y: cellY - 50 // Position above the cell
            };
        }
        return null;
    }

    /**
     * Reset array to empty state
     */
    reset() {
        this.values = new Array(this.size).fill('');
        this.highlights = new Array(this.size).fill(null);
        this.draw();
    }

    /**
     * Get current array state (for future save functionality)
     */
    getState() {
        return {
            size: this.size,
            values: [...this.values],
            highlights: [...this.highlights]
        };
    }
}

// ============================================================================
// POINTERS - Label Management
// ============================================================================

class PointerManager {
    constructor(layer) {
        this.layer = layer;
        this.pointers = {};
        this.pointerColors = {
            'i': '#FF6B6B',
            'j': '#4ECDC4',
            'low': '#95E1D3',
            'high': '#FFB84D',
            'left': '#A8D8EA',
            'right': '#FFB3BA',
            'mid': '#FFFACD',
            'start': '#B19CD9',
            'end': '#87CEEB'
        };
    }

    /**
     * Add a pointer label at a specific array index
     */
    addPointer(name, index) {
        if (!arrayVisualizer) return;

        const pos = arrayVisualizer.getCellPosition(index);
        if (!pos) {
            alert(`Invalid index: ${index}`);
            return;
        }

        // Remove existing pointer with same name
        if (this.pointers[name]) {
            this.pointers[name].destroy();
        }

        const color = this.pointerColors[name] || '#FFD700';

        // Create pointer group
        const pointerGroup = new Konva.Group({
            x: pos.x,
            y: pos.y
        });

        // Arrow
        const arrow = new Konva.Line({
            points: [0, 0, 0, 30],
            stroke: color,
            strokeWidth: 2,
            pointerLength: 15,
            pointerWidth: 15
        });

        // Label
        const label = new Konva.Text({
            x: -20,
            y: 35,
            text: name,
            fontSize: 14,
            fontFamily: 'Arial, monospace',
            fill: color,
            fontStyle: 'bold',
            background: '#FFF',
            padding: 3
        });

        pointerGroup.add(arrow, label);

        // Make pointer interactive
        pointerGroup.on('mouseenter', () => {
            pointerGroup.opacity(0.7);
            this.layer.batchDraw();
        });
        pointerGroup.on('mouseleave', () => {
            pointerGroup.opacity(1);
            this.layer.batchDraw();
        });
        pointerGroup.on('click', () => {
            this.removePointer(name);
        });

        this.layer.add(pointerGroup);
        this.pointers[name] = { group: pointerGroup, index: index };
        this.layer.draw();

        this.showInfo(`Added pointer: ${name} → [${index}]`);
    }

    /**
     * Remove a pointer
     */
    removePointer(name) {
        if (this.pointers[name]) {
            this.pointers[name].group.destroy();
            delete this.pointers[name];
            this.layer.draw();
            this.showInfo(`Removed pointer: ${name}`);
        }
    }

    /**
     * Clear all pointers
     */
    clearAll() {
        Object.keys(this.pointers).forEach(name => this.removePointer(name));
    }

    /**
     * Move a pointer to a new index
     */
    movePointer(name, newIndex) {
        if (this.pointers[name] && arrayVisualizer) {
            const pos = arrayVisualizer.getCellPosition(newIndex);
            if (pos) {
                this.pointers[name].group.x(pos.x);
                this.pointers[name].group.y(pos.y);
                this.pointers[name].index = newIndex;
                this.layer.draw();
                this.showInfo(`Moved pointer: ${name} → [${newIndex}]`);
            }
        }
    }
}

// ============================================================================
// TEXT ANNOTATIONS
// ============================================================================

class TextAnnotationManager {
    constructor(layer) {
        this.layer = layer;
        this.annotations = [];
        this.nextId = 0;
    }

    /**
     * Add text annotation at a specific position
     */
    addText(text, fontSize = 16) {
        // Add at a default position, user can click to reposition
        const x = 100 + this.nextId * 20;
        const y = 500 + this.nextId * 20;

        const group = new Konva.Group({
            x: x,
            y: y,
            draggable: true,
            name: 'annotation'
        });

        // Background rectangle
        const bg = new Konva.Rect({
            x: 0,
            y: 0,
            width: 200,
            height: 60,
            fill: '#FFFACD',
            stroke: '#666',
            strokeWidth: 1,
            cornerRadius: 4
        });

        // Text
        const textObj = new Konva.Text({
            x: 5,
            y: 5,
            width: 190,
            text: text,
            fontSize: fontSize,
            fontFamily: 'Arial',
            fill: '#000',
            wrap: 'word'
        });

        group.add(bg, textObj);

        // Delete on double-click
        group.on('dblclick', () => {
            this.removeText(this.nextId);
        });

        this.layer.add(group);
        this.annotations.push({ group, id: this.nextId });
        this.nextId++;
        this.layer.draw();

        this.showInfo(`Added text annotation (double-click to delete)`);
    }

    /**
     * Remove a text annotation
     */
    removeText(id) {
        const index = this.annotations.findIndex(a => a.id === id);
        if (index !== -1) {
            this.annotations[index].group.destroy();
            this.annotations.splice(index, 1);
            this.layer.draw();
        }
    }

    /**
     * Clear all annotations
     */
    clearAll() {
        this.annotations.forEach(a => a.group.destroy());
        this.annotations = [];
        this.layer.draw();
    }
}

// ============================================================================
// GLOBAL MANAGERS
// ============================================================================

let pointerManager = null;
let textManager = null;

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

/**
 * Show information message
 */
function showInfo(message) {
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    infoText.textContent = message;
    infoPanel.classList.remove('hidden');
    setTimeout(() => {
        infoPanel.classList.add('hidden');
    }, 3000);
}

/**
 * Hide information message
 */
function hideInfo() {
    const infoPanel = document.getElementById('info-panel');
    infoPanel.classList.add('hidden');
}

/**
 * Show/hide modal dialogs
 */
function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// ============================================================================
// MODAL HANDLERS
// ============================================================================

/**
 * Array Creation Modal
 */
function showArrayModal() {
    showModal('array-modal');
    document.getElementById('array-size').focus();
}

document.getElementById('array-confirm').addEventListener('click', () => {
    const size = parseInt(document.getElementById('array-size').value);
    if (size > 0 && size <= 20) {
        createArray(size);
        hideModal('array-modal');
    } else {
        alert('Please enter a size between 1 and 20');
    }
});

document.getElementById('array-cancel').addEventListener('click', () => {
    hideModal('array-modal');
});

function createArray(size) {
    arrayVisualizer = new ArrayVisualizer(size, mainLayer);
    showInfo(`Created array of size ${size}`);
}

/**
 * Pointer Label Modal
 */
function showPointerModal() {
    showModal('pointer-modal');
    document.getElementById('pointer-name').focus();
}

document.getElementById('pointer-confirm').addEventListener('click', () => {
    let name = document.getElementById('pointer-name').value;
    const custom = document.getElementById('pointer-custom').value;
    
    if (custom) {
        name = custom;
    }

    if (!name) {
        alert('Please select or enter a pointer name');
        return;
    }

    const index = parseInt(document.getElementById('pointer-index').value) || 0;

    if (!arrayVisualizer || index >= arrayVisualizer.size) {
        alert('Invalid index');
        return;
    }

    pointerManager.addPointer(name, index);
    hideModal('pointer-modal');

    // Reset
    document.getElementById('pointer-name').value = '';
    document.getElementById('pointer-custom').value = '';
    document.getElementById('pointer-index').value = '0';
});

document.getElementById('pointer-cancel').addEventListener('click', () => {
    hideModal('pointer-modal');
});

/**
 * Highlight Modal
 */
function showHighlightModal(index = null) {
    showModal('highlight-modal');
    if (index !== null) {
        document.getElementById('highlight-index').value = index;
    }
}

// Color selection
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedColor = e.target.dataset.color;
    });
});

// Initialize first color as selected
document.querySelector('.color-btn').classList.add('selected');

document.getElementById('highlight-confirm').addEventListener('click', () => {
    const index = parseInt(document.getElementById('highlight-index').value) || 0;

    if (!arrayVisualizer || index >= arrayVisualizer.size) {
        alert('Invalid index');
        return;
    }

    arrayVisualizer.highlightCell(index, selectedColor);
    hideModal('highlight-modal');
    showInfo(`Highlighted cell [${index}] with color`);
});

document.getElementById('highlight-cancel').addEventListener('click', () => {
    hideModal('highlight-modal');
});

/**
 * Text Annotation Modal
 */
function showTextModal() {
    showModal('text-modal');
    document.getElementById('text-input').focus();
}

document.getElementById('text-confirm').addEventListener('click', () => {
    const text = document.getElementById('text-input').value;
    const fontSize = parseInt(document.getElementById('text-size').value) || 16;

    if (!text) {
        alert('Please enter some text');
        return;
    }

    textManager.addText(text, fontSize);
    hideModal('text-modal');

    // Reset
    document.getElementById('text-input').value = '';
    document.getElementById('text-size').value = '16';
});

document.getElementById('text-cancel').addEventListener('click', () => {
    hideModal('text-modal');
});

// ============================================================================
// TOOLBAR EVENT LISTENERS
// ============================================================================

document.getElementById('btn-array').addEventListener('click', () => {
    currentMode = null;
    showArrayModal();
});

document.getElementById('btn-tree').addEventListener('click', () => {
    showInfo('🌳 Tree visualization coming soon!');
});

document.getElementById('btn-graph').addEventListener('click', () => {
    showInfo('🔗 Graph visualization coming soon!');
});

document.getElementById('btn-text').addEventListener('click', () => {
    if (!textManager) {
        showInfo('Text manager not initialized');
        return;
    }
    showTextModal();
});

document.getElementById('btn-highlight').addEventListener('click', () => {
    if (!arrayVisualizer) {
        showInfo('Please create an array first');
        return;
    }
    currentMode = currentMode === 'highlight' ? null : 'highlight';
    if (currentMode === 'highlight') {
        showInfo('Highlight mode: Click a cell to highlight it');
    } else {
        showInfo('Highlight mode disabled');
    }
});

document.getElementById('btn-pointer').addEventListener('click', () => {
    if (!arrayVisualizer) {
        showInfo('Please create an array first');
        return;
    }
    showPointerModal();
});

document.getElementById('btn-clear-all').addEventListener('click', () => {
    if (confirm('Clear all elements from canvas?')) {
        if (arrayVisualizer) {
            mainLayer.destroyChildren();
            arrayVisualizer = null;
        }
        if (pointerManager) {
            pointerManager.clearAll();
        }
        if (textManager) {
            textManager.clearAll();
        }
        mainLayer.draw();
        pointerLayer.draw();
        textLayer.draw();
        showInfo('Canvas cleared');
    }
});

// Close modals on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeStage();
    pointerManager = new PointerManager(pointerLayer);
    textManager = new TextAnnotationManager(textLayer);
    showInfo('Welcome to DSA Canvas Visualizer! Click "Array" to start.');
});
