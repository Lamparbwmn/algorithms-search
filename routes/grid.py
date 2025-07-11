from flask import Blueprint, request, jsonify
from algorithms.bfs import bfs
from algorithms.dfs import dfs
from algorithms.a import a

grid_bp = Blueprint('grid', __name__)

@grid_bp.route('/solve', methods=['POST'])
def solve():
    data = request.json
    algorithm = data.get("algorithm")
    grid = data.get("grid")
    start = tuple(data.get("start"))
    end = tuple(data.get("end"))
    print(algorithm)
    if algorithm == "BFS":
        path = bfs(grid, start, end)
    elif algorithm == "DFS":
        path = dfs(grid, start, end)
    elif algorithm == "A*":
        path = a(grid, start, end)
    else:
        return jsonify({"error": "Algoritmo no válido"}), 400

    return jsonify({"path": path})
