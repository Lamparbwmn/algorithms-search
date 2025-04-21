const rows = 15;
const cols = 15;
const gridEl = document.getElementById("grid");

let grid = [];
let start = null;
let end = null;

function createGrid() {
    grid = [];
    gridEl.innerHTML = '';
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = r;
            cell.dataset.col = c;

            cell.addEventListener("click", () => handleCellClick(cell));
            gridEl.appendChild(cell);
            row.push(cell);
        }
        grid.push(row);
    }
}

function handleCellClick(cell) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (!start) {
        cell.classList.add("start");
        start = [row, col];
    } else if (!end && !cell.classList.contains("start")) {
        cell.classList.add("end");
        end = [row, col];
    } else if (!cell.classList.contains("start") && !cell.classList.contains("end")) {
        cell.classList.toggle("wall");
    }
}

document.getElementById("startBtn").addEventListener("click", () => {
    if (!start || !end) return alert("Selecciona inicio y fin");

    const gridData = grid.map(row =>
        row.map(cell => cell.classList.contains("wall") ? 1 : 0)
    );

    fetch("/search", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ grid: gridData, start: start, end: end })
    })
    .then(res => res.json())
    .then(data => {
        data.visited.forEach(([r, c]) => {
            const cell = grid[r][c];
            if (!cell.classList.contains("start") && !cell.classList.contains("end")) {
                cell.classList.add("visited");
            }
        });

        data.path.forEach(([r, c]) => {
            const cell = grid[r][c];
            if (!cell.classList.contains("start") && !cell.classList.contains("end")) {
                cell.classList.remove("visited");
                cell.classList.add("path");
            }
        });
    });
});

createGrid();
