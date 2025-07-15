const gridEl = document.getElementById("grid");
let grid = [];
let start = null;
let end = null;
let currentStep = 0;
let steps = [];
let adjMatrix = null;
let rows = 3;
let cols = 3;
let autoExecution = null;
let currentState = 'setStart'; // 'setStart', 'setEnd', 'setWalls'
// --- Variables para el modo grafo ---
let graphNodes = [];
let graphEdges = [];

// Variables para arrastrar nodos
let isDraggingNode = false;
let draggedNode = null;
let offsetX = 0, offsetY = 0;
let clickTimeout = null;

let currentMode = 'grid';

// Variable global para el algoritmo seleccionado
let selectedAlgorithm = "bfs";

let uploadedAdjMatrix = null;


document.getElementById("downloadCellMatrixBtn").addEventListener("click", function() {
    // Exportar matriz de celdas (0 = libre, 1 = pared)
    const cellMatrix = grid.map(row =>
        row.map(cell => cell.classList.contains("wall") ? 1 : 0)
    );
    const csv = cellMatrix.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], {type: "text/csv"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "matriz_celdas.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
});

// Referencias a los elementos
const loadBtn = document.getElementById("loadAdjMatrixBtn");
const uploadInput = document.getElementById("uploadAdjMatrix");

// Evento: al seleccionar archivo, habilita/deshabilita el botón
uploadInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (!file) {
        loadBtn.disabled = true;
        return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
        const text = evt.target.result;
        const rows = text.trim().split("\n").map(line =>
            line.split(",").map(cell => parseInt(cell, 10))
        );
        uploadedAdjMatrix = rows;
        loadBtn.disabled = false;
    };
    reader.readAsText(file);
});

// Evento: al pulsar el botón, carga la matriz y limpia/habilita/deshabilita lo necesario
loadBtn.addEventListener("click", function() {
    if (!uploadedAdjMatrix) {
        alert("Primero selecciona un archivo CSV.");
        return;
    }
    if (currentMode === "grid") {
        rows = uploadedAdjMatrix.length;
        cols = uploadedAdjMatrix[0].length;
        createGrid();
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (uploadedAdjMatrix[r][c] !== 0) {
                    grid[r][c].classList.add("wall");
                }
            }
        }
        start = null;
        end = null;
        currentState = 'setStart';
        steps = [];
        currentStep = 0;
        updateDownloadBtnVisibility();
    } else if (currentMode === "graph") {
        graphNodes.forEach(n => graphContainer.removeChild(n.el));
        graphEdges.forEach(e => graphContainer.removeChild(e.el));
        graphNodes = [];
        graphEdges = [];
        const n = uploadedAdjMatrix.length;
        const centerX = 275;
        const centerY = 275;
        const radius = 200;
        for (let i = 0; i < n; i++) {
            const angle = (2 * Math.PI * i) / n;
            const x = centerX + radius * Math.cos(angle) - 18;
            const y = centerY + radius * Math.sin(angle) - 18;
            createGraphNode(x, y);
        }
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (uploadedAdjMatrix[i][j] !== 0) {
                    createGraphEdge(graphNodes[i].el, graphNodes[j].el);
                }
            }
        }
        deselectGraphNodes();
        steps = [];
        currentStep = 0;
        updateDownloadBtnVisibility();
    }
    loadBtn.disabled = true;
    uploadInput.value = "";
    uploadedAdjMatrix = null;
});

document.getElementById('viewMode').addEventListener('change', (e) => {
    currentMode = e.target.value;
    document.querySelector('.grid-container').style.display = (currentMode === 'grid') ? 'block' : 'none';
    document.getElementById('graphContainer').style.display = (currentMode === 'graph') ? 'block' : 'none';
    document.querySelector('.grid-size-control').style.display = (currentMode === 'grid') ? 'block' : 'none';
    document.getElementById("nextBtn").disabled = true;
    document.getElementById("prevBtn").disabled = true;
    document.getElementById("autoBtn").disabled = true;
    document.getElementById("info").textContent = "";
    updateDownloadBtnVisibility();
    if (currentMode === 'graph') {
        deselectGraphNodes();
    }
});

// Crear nodos en el grafo
const graphContainer = document.getElementById('graphContainer');
graphContainer.addEventListener('click', function(e) {
    if (e.target !== graphContainer) return;
    const rect = graphContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - 18;
    const y = e.clientY - rect.top - 18;
    createGraphNode(x, y);
});

function createGraphNode(x, y) {
    const node = document.createElement('div');
    node.className = 'graph-node';
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.textContent = graphNodes.length;
    node.dataset.id = graphNodes.length;

    node.addEventListener('click', (e) => {
        e.stopPropagation();
        if (clickTimeout) clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            selectGraphNode(node);
            clickTimeout = null;
        }, 200);
    });

    node.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (clickTimeout) clearTimeout(clickTimeout); // Cancela el click simple
        if (selectedGraphNodeForEdge && selectedGraphNodeForEdge !== node) {
            createGraphEdge(selectedGraphNodeForEdge, node);
            deselectGraphNodeForEdge();
        } else {
            selectGraphNodeForEdge(node);
        }
    });

    // Lógica de arrastre
    node.addEventListener('mousedown', (e) => {
        isDraggingNode = true;
        draggedNode = node;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
        document.addEventListener('mousemove', onNodeDrag);
        document.addEventListener('mouseup', stopNodeDrag);
    });
    graphContainer.appendChild(node);
    graphNodes.push({el: node, edges: []});
}

// Para crear aristas con doble click
let selectedGraphNodeForEdge = null;
function selectGraphNodeForEdge(node) {
    deselectGraphNodeForEdge();
    node.classList.add('selected-for-edge');
    selectedGraphNodeForEdge = node;
}
function deselectGraphNodeForEdge() {
    if (selectedGraphNodeForEdge) selectedGraphNodeForEdge.classList.remove('selected-for-edge');
    selectedGraphNodeForEdge = null;
}

function onNodeDrag(e) {
    if (!isDraggingNode || !draggedNode) return;
    const rect = graphContainer.getBoundingClientRect();
    let x = e.clientX - rect.left - offsetX;
    let y = e.clientY - rect.top - offsetY;
    // Limitar dentro del contenedor
    x = Math.max(0, Math.min(x, graphContainer.clientWidth - 36));
    y = Math.max(0, Math.min(y, graphContainer.clientHeight - 36));
    draggedNode.style.left = `${x}px`;
    draggedNode.style.top = `${y}px`;
    // Actualizar aristas conectadas
    updateGraphEdges();
}

function stopNodeDrag() {
    isDraggingNode = false;
    draggedNode = null;
    document.removeEventListener('mousemove', onNodeDrag);
    document.removeEventListener('mouseup', stopNodeDrag);
}

// Selección de nodos de inicio y fin en modo grafo usando start y end
function selectGraphNode(node) {
    const nodeId = parseInt(node.dataset.id);
    if (start === null) {
        start = nodeId;
        node.classList.add('selected-start');
        deselectGraphNodeForEdge();
    } else if (end === null && nodeId !== start) {
        end = nodeId;
        node.classList.add('selected-end');
        deselectGraphNodeForEdge();
    } else {
        deselectGraphNodes();
        start = nodeId;
        end = null;
        node.classList.add('selected-start');
        deselectGraphNodeForEdge();
    }
    updateGraphNodeStyles();
}

function deselectGraphNodes() {
    graphNodes.forEach(n => {
        n.el.classList.remove('selected-start', 'selected-end');
    });
    start = null;
    end = null;
}

function updateGraphNodeStyles() {
    graphNodes.forEach(n => {
        n.el.classList.remove('selected-start', 'selected-end');
        if (start !== null && parseInt(n.el.dataset.id) === start) {
            n.el.classList.add('selected-start');
        }
        if (end !== null && parseInt(n.el.dataset.id) === end) {
            n.el.classList.add('selected-end');
        }
    });
}

function createGraphEdge(nodeA, nodeB) {
    const idA = parseInt(nodeA.dataset.id);
    const idB = parseInt(nodeB.dataset.id);
    if (graphNodes[idA].edges.includes(idB)) return;

    graphNodes[idA].edges.push(idB);
    graphNodes[idB].edges.push(idA);

    const edge = document.createElement('div');
    edge.className = 'graph-edge';

    // Crear el span para la distancia
    const label = document.createElement('span');
    label.className = 'edge-label';
    edge.appendChild(label);

    positionEdge(edge, nodeA, nodeB, label);
    graphContainer.appendChild(edge);
    graphEdges.push({el: edge, from: idA, to: idB, label: label});
}

function positionEdge(edge, nodeA, nodeB, label = null) {
    const rectA = nodeA.getBoundingClientRect();
    const rectB = nodeB.getBoundingClientRect();
    const parentRect = graphContainer.getBoundingClientRect();

    const ax = rectA.left - parentRect.left + rectA.width / 2;
    const ay = rectA.top - parentRect.top + rectA.height / 2;
    const bx = rectB.left - parentRect.left + rectB.width / 2;
    const by = rectB.top - parentRect.top + rectB.height / 2;

    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Acortar la línea para que no cruce el nodo (radio = 18px)
    const r = 18;
    const ax2 = ax + dx * (r / length);
    const ay2 = ay + dy * (r / length);
    const bx2 = bx - dx * (r / length);
    const by2 = by - dy * (r / length);
    const newDx = bx2 - ax2;
    const newDy = by2 - ay2;
    const newLength = Math.sqrt(newDx * newDx + newDy * newDy);
    const angle = Math.atan2(newDy, newDx) * 180 / Math.PI;

    edge.style.position = 'absolute';
    edge.style.left = `${ax2}px`;
    edge.style.top = `${ay2}px`;
    edge.style.width = `${newLength}px`;
    edge.style.height = '4px';
    edge.style.background = 'linear-gradient(90deg, #1976d2 0%, #6f42c1 100%)';
    edge.style.borderRadius = '4px';
    edge.style.transform = `rotate(${angle}deg)`;
    edge.style.transformOrigin = '0 0';
    edge.style.zIndex = 1;

    if (label) {
        label.textContent = newLength.toFixed(0);
        label.style.position = 'absolute';
        label.style.left = `${newLength / 2 - 12}px`;
        label.style.top = `-18px`;
        label.style.background = '#fff';
        label.style.padding = '2px 6px';
        label.style.borderRadius = '8px';
        label.style.fontSize = '12px';
        label.style.color = '#24292e';
        label.style.border = '1px solid #e1e4e8';
        label.style.pointerEvents = 'none';
        label.style.transform = 'none';
    }
}

function updateGraphEdges() {
    graphEdges.forEach(edge => {
        const nodeA = graphNodes[edge.from].el;
        const nodeB = graphNodes[edge.to].el;
        positionEdge(edge.el, nodeA, nodeB, edge.label);
    });
}

function runGraphAlgorithm() {
    if (start === null || end === null) {
        alert("Selecciona un nodo de inicio y uno de fin");
        return;
    }
    selectedAlgorithm = document.getElementById("algorithm").value;
    // Incluye x, y en cada nodo
    const nodes = graphNodes.map((n, i) => ({
        id: i,
        x: n.el ? parseInt(n.el.style.left) : 0,
        y: n.el ? parseInt(n.el.style.top) : 0
    }));
    let edges = [];
    if (selectedAlgorithm === "ucs" || selectedAlgorithm === "a*") {
        graphNodes.forEach((n, i) => {
            n.edges.forEach(j => {
                if (i < j) {
                    const edgeObj = graphEdges.find(e =>
                        (e.from === i && e.to === j) || (e.from === j && e.to === i)
                    );
                    let weight = 1;
                    if (edgeObj && edgeObj.el && edgeObj.el.style.width) {
                        weight = Math.round(parseFloat(edgeObj.el.style.width));
                    }
                    edges.push([i, j, weight]);
                }
            });
        });
    } else {
        graphNodes.forEach((n, i) => {
            n.edges.forEach(j => {
                if (i < j) edges.push([i, j]);
            });
        });
    }

    fetch("/graph_search", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            nodes: nodes,
            edges: edges,
            start: start,
            end: end,
            algorithm: selectedAlgorithm
        })
    })
    .then(res => res.json())
    .then(data => {
        steps = data.steps;
        adjMatrix = data.adjMatrix;
        currentStep = 0;
        showGraphCurrentStep();
        document.getElementById("nextBtn").disabled = false;
        document.getElementById("prevBtn").disabled = true;
        document.getElementById("autoBtn").disabled = false;
        updateDownloadBtnVisibility();
    })
    .catch(error => {
        alert("Error al ejecutar el algoritmo en el grafo");
    });
}

function showGraphCurrentStep() {
    // Limpiar colores de nodos
    graphNodes.forEach(n => {
        n.el.style.background = "#2ea44f";
        n.el.classList.remove("selected-start", "selected-end");
        n.el.style.color = "#222";
        n.el.style.fontFamily = "'Segoe UI', Arial, sans-serif";
        n.el.style.fontWeight = "700";
        n.el.style.fontSize = "18px";
        n.el.style.textShadow = "0 1px 2px #fff, 0 0 1px #fff";
    });
    updateGraphNodeStyles();

    // Limpiar colores de aristas
    graphEdges.forEach(e => {
        e.el.classList.remove("visited", "path");
    });

    if (!steps || steps.length === 0) return;
    const step = steps[currentStep];

    // Colorear aristas del camino actual (amarillo)
    if (step.current_path && step.current_path.length > 1) {
        for (let i = 0; i < step.current_path.length - 1; i++) {
            const a = step.current_path[i];
            const b = step.current_path[i + 1];
            const edge = graphEdges.find(
                e => (e.from === a && e.to === b) || (e.from === b && e.to === a)
            );
            if (edge) edge.el.classList.add("visited");
        }
    }

    // Si se encontró el destino, colorear el camino final en naranja
    if (step.found && step.current_path && step.current_path.length > 1) {
        for (let i = 0; i < step.current_path.length - 1; i++) {
            const a = step.current_path[i];
            const b = step.current_path[i + 1];
            const edge = graphEdges.find(
                e => (e.from === a && e.to === b) || (e.from === b && e.to === a)
            );
            if (edge) {
                edge.el.classList.remove("visited");
                edge.el.classList.add("path");
            }
        }
    }

    // Colorear nodos visitados
    if (step.visited) {
        step.visited.forEach(id => {
            if (id !== start && id !== end && graphNodes[id]) {
                graphNodes[id].el.style.background = "#ffeb3b";
            }
        });
    }
    // Nodo actual (azul)
    if (step.current !== undefined && graphNodes[step.current]) {
        if (step.current !== start && step.current !== end) {
            graphNodes[step.current].el.style.background = "#00bcd4";
        }
    }

    // Mostrar matriz de adyacencia si existe
    let infoHTML = "";
    if (adjMatrix && adjMatrix.matrix) {
        infoHTML += "<div><strong>Matriz de adyacencia:</strong>";
        let tableHTML = '<table class="matrix-container"><tr><th></th>';
        adjMatrix.labels.forEach(label => {
            tableHTML += `<th>${label}</th>`;
        });
        tableHTML += '</tr>';
        adjMatrix.matrix.forEach((row, index) => {
            tableHTML += `<tr><th>${adjMatrix.labels[index]}</th>`;
            row.forEach(cell => {
                tableHTML += `<td>${cell}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</table></div>';
        infoHTML += tableHTML;
    }

    infoHTML += `<div style="margin-top:10px;">
        <strong>Paso:</strong> ${currentStep + 1} / ${steps.length}<br>`;
    if (selectedAlgorithm === "bfs") {
        if (step.current !== undefined) infoHTML += `<strong>Nodo actual:</strong> ${step.current}<br>`;
        if (step.queue) infoHTML += `<strong>Cola:</strong> [${step.queue.join(", ")}]<br>`;
        if (step.visited) infoHTML += `<strong>Nodos visitados:</strong> [${step.visited.join(", ")}]<br>`;
        if (step.current_path) infoHTML += `<strong>Camino actual:</strong> [${step.current_path.join(" → ")}]<br>`;
        if (step.current_path) infoHTML += `<strong>Longitud del camino:</strong> ${step.current_path.length}<br>`;
    } else if (selectedAlgorithm === "ucs") {
        if (step.current !== undefined) infoHTML += `<strong>Nodo actual:</strong> ${step.current} (${step.current_cost !== undefined ? step.current_cost : 0})<br>`;
        if (step.queue) infoHTML += `<strong>Cola:</strong> [${step.queue.map(q => `${q.node} (${q.cost})`).join(", ")}]<br>`;
        if (step.visited) infoHTML += `<strong>Nodos visitados:</strong> [${step.visited.join(", ")}]<br>`;
        if (step.current_path && step.current_path_costs) {
            infoHTML += `<strong>Camino actual:</strong> [${step.current_path.map((n, i) => `${n} (${step.current_path_costs[i]})`).join(" → ")}]<br>`;
            infoHTML += `<strong>Longitud del camino:</strong> ${step.current_path.length}<br>`;
        }
    } else {
        if (step.queue) infoHTML += `Cola: [${step.queue.join(", ")}]\n`;
        if (step.visited) infoHTML += `Nodos visitados: ${step.visited.length}`;
    }
    if (step.found) infoHTML += "<br><span style='color:green; font-weight:bold;'>¡Destino encontrado!</span>";
    infoHTML += "</div>";

    document.getElementById("info").innerHTML = infoHTML;
    updateDownloadBtnVisibility();
}

// Mostrar u ocultar el botón de descarga según el modo y la matriz
function updateDownloadBtnVisibility() {
    const btnAdj = document.getElementById("downloadAdjMatrixBtn");
    const btnCell = document.getElementById("downloadCellMatrixBtn");
    if (adjMatrix && adjMatrix.matrix && (currentMode === "graph" || currentMode === "grid")) {
        btnAdj.style.display = "inline-block";
    } else {
        btnAdj.style.display = "none";
    }
    // Mostrar el de celdas solo en modo cuadrícula
    if (currentMode === "grid" && adjMatrix && adjMatrix.matrix) {
        btnCell.style.display = "inline-block";
    } else {
        btnCell.style.display = "none";
    }
}

// Evento para descargar la matriz
document.getElementById("downloadAdjMatrixBtn").addEventListener("click", function() {
    if (!adjMatrix) return;
    fetch("/descarga_csv", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({adjMatrix: adjMatrix})
    })
    .then(response => {
        if (!response.ok) throw new Error("Error al generar el CSV");
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "matriz_adyacencia.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(() => alert("No se pudo descargar el archivo CSV"));
});

// Modificar la función createGrid()
function createGrid() {
    grid = [];
    const container = gridEl.parentElement;

    // Actualizar los valores de las variables CSS personalizadas
    document.documentElement.style.setProperty('--grid-rows', rows);
    document.documentElement.style.setProperty('--grid-cols', cols);

    // Limpiar índices existentes
    const siblings = Array.from(container.children);
    siblings.forEach(child => {
        if (child !== gridEl) {
            container.removeChild(child);
        }
    });

    // Limpiar la cuadrícula
    gridEl.innerHTML = '';

    // Calcular dimensiones de celda
    const gridSize = 550; // Tamaño total del grid
    const cellWidth = (gridSize - (cols + 1)) / cols;
    const cellHeight = (gridSize - (rows + 1)) / rows;

    // Configurar la cuadrícula
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = `repeat(${cols}, ${cellWidth}px)`;
    gridEl.style.gridTemplateRows = `repeat(${rows}, ${cellHeight}px)`;
    gridEl.style.gap = '1px';
    gridEl.style.padding = '2px';

    // Usar la posición actual del grid para colocar los índices
    const offsetLeft = gridEl.offsetLeft;
    const offsetTop = gridEl.offsetTop;

    // Crear índices de columnas
    for (let c = 0; c < cols; c++) {
        const colIndex = document.createElement("div");
        colIndex.classList.add("grid-col-index");
        colIndex.style.left = `${offsetLeft + (c * (cellWidth + 1))}px`;
        colIndex.textContent = String.fromCharCode(65 + c);
        container.appendChild(colIndex);
    }

    // Crear índices de filas
    for (let r = 0; r < rows; r++) {
        const rowIndex = document.createElement("div");
        rowIndex.classList.add("grid-row-index");
        rowIndex.style.top = `${offsetTop + (r * (cellHeight + 1))}px`;
        rowIndex.textContent = r;
        container.appendChild(rowIndex);
    }

    // Crear celdas
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = r;
            cell.dataset.col = c;

            const heuristic = document.createElement("span");
            heuristic.classList.add("heuristic");
            cell.appendChild(heuristic);

            cell.addEventListener("click", () => handleCellClick(cell));
            gridEl.appendChild(cell);
            row.push(cell);
        }
        grid.push(row);
    }

    if (end) {
        updateHeuristics();
    }
}

// Modificar la inicialización
document.addEventListener('DOMContentLoaded', () => {
    if (!gridEl) {
        console.error('No se encontró el elemento grid');
        return;
    }
    createGrid();
    document.getElementById("nextBtn").disabled = true;
    document.getElementById("prevBtn").disabled = true;
    document.getElementById("autoBtn").disabled = true;
});

// Función para actualizar las heurísticas
function updateHeuristics() {
    if (!end) return;
    const heuristicAlgorithms = ["a*", "hillclimbing", "lhs"];
    grid.forEach(row => {
        row.forEach(cell => {
            const hEl = cell.querySelector(".heuristic");
            if (heuristicAlgorithms.includes(selectedAlgorithm)) {
                const r = parseInt(cell.dataset.row);
                const c = parseInt(cell.dataset.col);
                const h = manhattanDistance([r, c], [parseInt(end[0]), parseInt(end[1])]);
                hEl.textContent = h;
            } else {
                hEl.textContent = "";
            }
        });
    });
}

function manhattanDistance(p1, p2) {
    return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]);
}

function updateGridSize() {
    let sizeX = Math.min(Math.max(parseInt(document.getElementById("gridSizeX").value) || 3, 2), 15);
    let sizeY = Math.min(Math.max(parseInt(document.getElementById("gridSizeY").value) || 3, 2), 15);

    document.getElementById("gridSizeX").value = sizeX;
    document.getElementById("gridSizeY").value = sizeY;

    rows = sizeY;
    cols = sizeX;

    start = null;
    end = null;
    steps = [];
    currentStep = 0;
    currentState = 'setStart';

    document.getElementById("nextBtn").disabled = true;
    document.getElementById("prevBtn").disabled = true;
    document.getElementById("autoBtn").disabled = true;

    createGrid();
}

function handleCellClick(cell) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (currentState === 'setStart' && !cell.classList.contains('wall')) {
        if (start) {
            grid[start[0]][start[1]].classList.remove('start');
        }
        cell.classList.add('start');
        start = [row, col];
        currentState = 'setEnd';
    } else if (currentState === 'setEnd' && !cell.classList.contains('start') && !cell.classList.contains('wall')) {
        if (end) {
            grid[end[0]][end[1]].classList.remove('end');
        }
        cell.classList.add('end');
        end = [row, col];
        currentState = 'setWalls';
        updateHeuristics();
    } else if (currentState === 'setWalls' && !cell.classList.contains('start') && !cell.classList.contains('end')) {
        cell.classList.toggle('wall');
        updateHeuristics();
    }
}

function clearVisualization() {
    for(let row of grid) {
        for(let cell of row) {
            cell.classList.remove("visited", "path", "current");
            if (!cell.classList.contains("start") &&
                !cell.classList.contains("end") &&
                !cell.classList.contains("wall")) {
                cell.removeAttribute("style");
            }
        }
    }
}

function showCurrentStep() {
    clearVisualization();
    const step = steps[currentStep];
    step.visited.forEach(([r, c]) => {
        const cell = grid[r][c];
        if (!cell.classList.contains("start") && !cell.classList.contains("end")) {
            cell.classList.add("visited");
        }
    });
    step.current_path.forEach(([r, c]) => {
        const cell = grid[r][c];
        if (!cell.classList.contains("start") && !cell.classList.contains("end")) {
            cell.classList.remove("visited");
            cell.classList.add("path");
        }
    });
    const [r, c] = step.current;
    const currentCell = grid[r][c];
    if (!currentCell.classList.contains("start") && !currentCell.classList.contains("end")) {
        currentCell.classList.add("current");
    }

    let infoHTML = "";
    if (adjMatrix && adjMatrix.matrix) {
        infoHTML += "<div><strong>Matriz de adyacencia:</strong>";
        let tableHTML = '<table class="matrix-container"><tr><th></th>';
        adjMatrix.labels.forEach(label => {
            tableHTML += `<th>${label}</th>`;
        });
        tableHTML += '</tr>';
        adjMatrix.matrix.forEach((row, index) => {
            tableHTML += `<tr><th>${adjMatrix.labels[index]}</th>`;
            row.forEach(cell => {
                tableHTML += `<td>${cell}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</table></div>';
        infoHTML += tableHTML;
    }

    infoHTML += `<div style="margin-top:10px;">
        <strong>Paso:</strong> ${currentStep + 1} / ${steps.length}<br>`;

    if (selectedAlgorithm === "a*") {
        infoHTML += `<strong>Nodo actual:</strong> ${step.current ? `${step.current[0]}${String.fromCharCode(65 + step.current[1])}` : ""}${step.current_f !== undefined ? ` (f=${step.current_f}, g=${step.current_g}, h=${step.current_h})` : ""}<br>`;
        infoHTML += `<strong>Cola de prioridad:</strong><br>${
            step.queue_info ? step.queue_info.map(q =>
                `${q.pos[0]}${String.fromCharCode(65 + q.pos[1])} (f=${q.f}, g=${q.g}, h=${q.h})`
            ).join("<br>") : ""
        }<br>`;
    } else {
        infoHTML += `<strong>Cola:</strong> [${
            step.queue.map(([r, c]) => {
                let colLabel = adjMatrix && adjMatrix.labels ? String.fromCharCode(65 + c) : c;
                return `${r}${colLabel}`;
            }).join(", ")
        }]<br>`;
    }

    infoHTML += `<strong>Nodos visitados:</strong> ${step.visited.length} | <strong>Longitud del camino:</strong> ${step.current_path.length}`;
    if (step.found) infoHTML += "<br><span style='color:green; font-weight:bold;'>¡Destino encontrado!</span>";
    infoHTML += "</div>";

    document.getElementById("info").innerHTML = infoHTML;
    updateDownloadBtnVisibility();
}

function nextStep() {
    if (currentStep < steps.length - 1) {
        currentStep++;
        if (currentMode === "grid") {
            showCurrentStep();
        } else {
            showGraphCurrentStep();
        }
        document.getElementById("prevBtn").disabled = false;
        if (currentStep === steps.length - 1) {
            document.getElementById("nextBtn").disabled = true;
        }
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        if (currentMode === "grid") {
            showCurrentStep();
        } else {
            showGraphCurrentStep();
        }
        document.getElementById("nextBtn").disabled = false;
        if (currentStep === 0) {
            document.getElementById("prevBtn").disabled = true;
        }
    }
}

document.getElementById("updateSize").addEventListener("click", updateGridSize);

document.getElementById("resetBtn").addEventListener("click", () => {
    if (currentMode === "grid") {
        start = null;
        end = null;
        steps = [];
        currentStep = 0;
        currentState = 'setStart';
        createGrid();
        document.getElementById("nextBtn").disabled = true;
        document.getElementById("prevBtn").disabled = true;
        document.getElementById("autoBtn").disabled = true;
        updateDownloadBtnVisibility();
    } else if (currentMode === "graph") {
        graphNodes.forEach(n => graphContainer.removeChild(n.el));
        graphEdges.forEach(e => graphContainer.removeChild(e.el));
        graphNodes = [];
        graphEdges = [];
        deselectGraphNodes();
        steps = [];
        currentStep = 0;
        document.getElementById("info").textContent = "";
        document.getElementById("nextBtn").disabled = true;
        document.getElementById("prevBtn").disabled = true;
        document.getElementById("autoBtn").disabled = true;
        updateDownloadBtnVisibility();
    }
});

document.getElementById("autoBtn").addEventListener("click", function() {
    if (autoExecution) {
        clearInterval(autoExecution);
        autoExecution = null;
        this.textContent = "Ejecutar automático";
    } else {
        this.textContent = "Detener";
        autoExecution = setInterval(() => {
            if (currentStep < steps.length - 1) {
                nextStep();
            } else {
                clearInterval(autoExecution);
                autoExecution = null;
                this.textContent = "Ejecutar automático";
            }
        }, 500);
    }
});

document.getElementById("startBtn").addEventListener("click", () => {
    if(currentMode === 'graph') {
        runGraphAlgorithm();
    }else if (currentMode === 'grid') {
        if (!start || !end) {
            alert("Selecciona inicio y fin");
            return;
        }
        clearVisualization();
        currentStep = 0;
        selectedAlgorithm = document.getElementById("algorithm").value;
        if (autoExecution) {
            clearInterval(autoExecution);
            autoExecution = null;
            document.getElementById("autoBtn").textContent = "Ejecutar automático";
        }
        const gridData = grid.map(row =>
            row.map(cell => cell.classList.contains("wall") ? 1 : 0)
        );
        fetch("/search", {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                grid: gridData,
                start: start,
                end: end,
                algorithm: selectedAlgorithm
            })
        })
        .then(res => res.json())
        .then(data => {
            steps = data.steps;
            adjMatrix = data.adjMatrix;
            showCurrentStep();
            document.getElementById("nextBtn").disabled = false;
            document.getElementById("prevBtn").disabled = true;
            document.getElementById("autoBtn").disabled = false;
            updateDownloadBtnVisibility();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al ejecutar el algoritmo');
        });
    }
});

document.getElementById("nextBtn").addEventListener("click", () => {
    nextStep();
});

document.getElementById("prevBtn").addEventListener("click", () => {
    prevStep();
});

window.addEventListener('load', () => {
    createGrid();
});