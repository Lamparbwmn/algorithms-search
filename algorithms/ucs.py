import heapq
from .utils import vecinos_posibles

def search(grid, inicio, fin):
    heap = [(0, inicio, [inicio])]
    visitados = {inicio}
    pasos = [{
        'current': inicio,
        'visited': list(visitados),
        'current_path': [inicio],
        'queue': [inicio],
        'found': False
    }]
    while heap:
        coste, actual, camino = heapq.heappop(heap)
        if actual == fin:
            pasos.append({
                'current': actual,
                'visited': list(visitados),
                'current_path': camino,
                'queue': [item[1] for item in heap],
                'found': True
            })
            return pasos
        for vecino in vecinos_posibles(grid, actual, visitados):
            visitados.add(vecino)
            nuevo_camino = camino + [vecino]
            heapq.heappush(heap, (coste + 1, vecino, nuevo_camino))
            pasos.append({
                'current': vecino,
                'visited': list(visitados),
                'current_path': nuevo_camino,
                'queue': [item[1] for item in heap],
                'found': False
            })
    return pasos

def search_graph(nodes, edges, inicio, fin=None):
    # Construir vecinos con pesos
    vecinos = {n['id']: [] for n in nodes}
    for a, b, w in edges:
        vecinos[a].append((b, w))
        vecinos[b].append((a, w))
    heap = [(0, inicio, [inicio], [0])]  # (coste acumulado, nodo, camino, lista de costes acumulados)
    visitados = set()
    pasos = [{
        'current': inicio,
        'current_cost': 0,
        'visited': list(visitados),
        'current_path': [inicio],
        'current_path_costs': [0],
        'queue': [{'node': inicio, 'cost': 0}],
        'found': False
    }]
    while heap:
        coste, actual, camino, costes_camino = heapq.heappop(heap)
        if actual == fin:
            pasos.append({
                'current': actual,
                'current_cost': coste,
                'visited': list(visitados),
                'current_path': camino,
                'current_path_costs': costes_camino,
                'queue': [{'node': item[1], 'cost': item[0]} for item in heap],
                'found': True
            })
            return pasos
        if actual in visitados:
            continue
        visitados.add(actual)
        for vecino, peso in vecinos[actual]:
            if vecino not in visitados:
                nuevo_camino = camino + [vecino]
                costes_nuevo_camino = costes_camino + [coste + peso]
                heapq.heappush(heap, (coste + peso, vecino, nuevo_camino, costes_nuevo_camino))
                pasos.append({
                    'current': vecino,
                    'current_cost': coste + peso,
                    'visited': list(visitados),
                    'current_path': nuevo_camino,
                    'current_path_costs': costes_nuevo_camino,
                    'queue': [{'node': item[1], 'cost': item[0]} for item in heap],
                    'found': False
                })
    return pasos