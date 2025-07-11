# - Implementación de algoritmos BFS, DFS, UCS, Hill Climbing y LHS (búsqueda en amplitud, profundidad, coste uniforme, ascenso de colinas y por horizonte)
# - Generación de instancias (matrices de adyacencia)
# - Desarrollo de interfaz web intuitiva (poder elegir algoritmos, resolver instancias)
# - Visualización de grafos (pinta grafo y el camino recorrido según los algoritmos propuestos)
# - Escritura de memoria en LáTex

from flask import Flask, render_template, request, jsonify, send_file
from algorithms import bfs, dfs, a, ucs, hillclimbing, lhs
import io
import csv


app = Flask(__name__)

def crear_matriz_adyacencia(grid):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0

    nodos_libres = {}
    index = 0
    etiquetas = []
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 0:
                # Etiquetas tipo 0A
                etiqueta = f"{r}{chr(65 + c)}"
                nodos_libres[(r, c)] = index
                etiquetas.append(etiqueta)
                index += 1

    n_libres = len(nodos_libres)
    matriz = [[0 for _ in range(n_libres)] for _ in range(n_libres)]

    # Unir celda y vecinos
    for (r, c), actual_index in nodos_libres.items():
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            # Si vecino en nodos libres
            if (nr, nc) in nodos_libres:
                vecino_index = nodos_libres[(nr, nc)]
                matriz[actual_index][vecino_index] = 1

    return {"matrix": matriz, "labels": etiquetas}

def crear_matriz_adyacencia_grafo(nodes, edges):
    n = len(nodes)
    matriz = [[0 for _ in range(n)] for _ in range(n)]
    for edge in edges:
        # Sin peso
        if len(edge) == 2:
            a, b = edge
            w = 1
        # Con peso
        else:
            a, b, w = edge
        matriz[a][b] = w
        matriz[b][a] = w
    etiquetas = [str(i) for i in range(n)]
    return {"matrix": matriz, "labels": etiquetas}

@app.route("/")
def index():
    return render_template("index.html")

# Ejecutar algoritmo en cuadrícula
@app.route("/search", methods=["POST"])
def search():
    data = request.get_json()
    grid = data["grid"]
    inicio = tuple(data["start"])
    fin = tuple(data["end"])
    algoritmo = data.get("algorithm", "bfs")

    algoritmos = {
        "dfs": dfs.search,
        "bfs": bfs.search,
        "a*": a.search,
        "ucs": ucs.search,
        "hillclimbing": hillclimbing.search,
        "lhs": lambda g, s, e: lhs.search(g, s, e, horizon=5)
    }
    pasos = algoritmos[algoritmo](grid, inicio, fin)
    matriz_adya = crear_matriz_adyacencia(grid)
    return jsonify({"steps": pasos, "adjMatrix": matriz_adya})

@app.route('/graph_search', methods=['POST'])
def graph_search():
    data = request.json
    nodes = data['nodes']
    edges = data['edges']
    inicio = int(data['start'])
    fin = int(data['end']) if 'end' in data else None
    algoritmo = data.get('algorithm', 'bfs')

    algoritmos = {
        "dfs": lambda n, e, s: dfs.search_graph(n, e, s, fin),
        "bfs": lambda n, e, s: bfs.search_graph(n, e, s, fin),
        "a*": lambda n, e, s: a.search_graph(n, e, s, fin),
        "ucs": lambda n, e, s: ucs.search_graph(n, e, s, fin),
        "hillclimbing": lambda n, e, s: hillclimbing.search_graph(n, e, s, fin),
        "lhs": lambda n, e, s: lhs.search_graph(n, e, s, fin, horizon=5)
    }
    pasos = algoritmos[algoritmo](nodes, edges, inicio)
    matriz_adya = crear_matriz_adyacencia_grafo(nodes, edges)
    return jsonify({'steps': pasos, 'adjMatrix': matriz_adya})

@app.route('/descarga_csv', methods=['POST'])
def descarga_csv():
    data = request.get_json()
    matriz = data.get("adjMatrix")
    if not matriz or not matriz.get("matrix"):
        return jsonify({"error": "Matriz de adyacencia no válida"}), 400
    output = io.StringIO()
    writer = csv.writer(output)
    for row in matriz["matrix"]:
        writer.writerow(row)
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype="text/csv",
        as_attachment=True,
        download_name="matriz_adyacencia.csv"
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

