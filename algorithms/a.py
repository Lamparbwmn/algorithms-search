import heapq
from .utils import vecinos_posibles, manhattan_distance

def search(grid, inicio, fin):
    heap = [(manhattan_distance(inicio, fin), 0, inicio, [inicio])]
    visitados = set()
    mejorG = {inicio: 0}

    # Paso inicial
    pasos = [{
        'current': inicio,
        'visited': list(visitados),
        'current_path': [inicio],
        'queue': [inicio],  # El nodo inicio está en la cola al principio
        'queue_info': [{
            'pos': inicio,
            'f': manhattan_distance(inicio, fin),
            'g': 0,
            'h': manhattan_distance(inicio, fin)
        }],
        'current_f': manhattan_distance(inicio, fin),
        'current_g': 0,
        'current_h': manhattan_distance(inicio, fin),
        'found': False
    }]

    while heap:
        f, g, actual, camino = heapq.heappop(heap)
        visitados.add(actual)

        if actual == fin:
            pasos.append({
                'current': actual,
                'visited': list(visitados),
                'current_path': camino,
                'queue': [item[2] for item in heap],
                'queue_info': [
                    {'pos': item[2], 'f': item[0], 'g': item[1], 'h': item[0] - item[1]}
                    for item in heap
                ],
                'current_f': f,
                'current_g': g,
                'current_h': manhattan_distance(actual, fin),
                'found': True
            })
            return pasos

        # Procesar vecinos y actualizar heap
        vecinos_heap = []
        for vecino in vecinos_posibles(grid, actual, visitados):
            nuevoG = g + 1
            if vecino not in mejorG or nuevoG < mejorG[vecino]:
                mejorG[vecino] = nuevoG
                nuevoF = nuevoG + manhattan_distance(vecino, fin)
                vecinos_heap.append((nuevoF, nuevoG, vecino, camino + [vecino]))

        # Añadir todos los vecinos al heap
        for v in vecinos_heap:
            heapq.heappush(heap, v)

        # Registrar el paso después de procesar el nodo actual
        pasos.append({
            'current': actual,
            'visited': list(visitados),
            'current_path': camino,
            'queue': [item[2] for item in heap],
            'queue_info': [
                {'pos': item[2], 'f': item[0], 'g': item[1], 'h': item[0] - item[1]}
                for item in heap
            ],
            'current_f': f,
            'current_g': g,
            'current_h': manhattan_distance(actual, fin),
            'found': False
        })

    return pasos
def search_graph(nodes, edges, inicio, fin=None):
    # Construir vecinos con pesos
    vecinos = {n['id']: [] for n in nodes}
    for a, b, w in edges:
        vecinos[a].append((b, w))
        vecinos[b].append((a, w))
    # Diccionario de posiciones
    posiciones_nodos = {n['id']: (n.get('x', 0), n.get('y', 0)) for n in nodes}
    def heuristic(n, e):
        x1, y1 = posiciones_nodos[n]
        x2, y2 = posiciones_nodos[e]
        return abs(x1 - x2) + abs(y1 - y2)  # Manhattan
    heap = [(heuristic(inicio, fin), 0, inicio, [inicio])]
    visitados = set()
    pasos = []
    while heap:
        f, g, actual, camino = heapq.heappop(heap)
        if actual == fin:
            pasos.append({
                'current': actual,
                'current_f': f,
                'current_g': g,
                'current_h': f - g,
                'visited': list(visitados),
                'current_path': camino,
                'queue_info': [
                    {'pos': item[2], 'f': item[0], 'g': item[1], 'h': item[0] - item[1]}
                    for item in heap
                ],
                'found': True
            })
            return pasos
        visitados.add(actual)
        for vecino, peso in vecinos[actual]:
            if vecino not in visitados:
                nuevoG = g + peso
                nuevoF = nuevoG + heuristic(vecino, fin)
                heapq.heappush(heap, (nuevoF, nuevoG, vecino, camino + [vecino]))
        pasos.append({
            'current': actual,
            'current_f': f,
            'current_g': g,
            'current_h': f - g,
            'visited': list(visitados),
            'current_path': camino,
            'queue_info': [
                {'pos': item[2], 'f': item[0], 'g': item[1], 'h': item[0] - item[1]}
                for item in heap
            ],
            'found': False
        })
    return pasos