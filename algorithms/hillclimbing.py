from .utils import vecinos_posibles, manhattan_distance

def search(grid, start, end):
    current = start
    path = [current]
    visited = {current}
    steps = [{
        'current': current,
        'visited': list(visited),
        'current_path': list(path),
        'queue': [current],
        'found': False
    }]
    while current != end:
        neighbors = [n for n in vecinos_posibles(grid, current, visited)]
        if not neighbors:
            break
        next_pos = min(neighbors, key=lambda n: manhattan_distance(n, end))
        if next_pos in visited:
            break
        visited.add(next_pos)
        path.append(next_pos)
        current = next_pos
        steps.append({
            'current': current,
            'visited': list(visited),
            'current_path': list(path),
            'queue': [current],
            'found': current == end
        })
        if current == end:
            break
    return steps

def search_graph(nodes, edges, start, end=None):
    if end is None:
        return []
    neighbors = {n['id']: [] for n in nodes}
    for a, b in edges:
        neighbors[a].append(b)
        neighbors[b].append(a)
    current = start
    path = [current]
    visited = {current}
    steps = [{
        'current': current,
        'visited': list(visited),
        'current_path': list(path),
        'queue': [current],
        'found': False
    }]
    while current != end:
        nexts = [n for n in neighbors[current] if n not in visited]
        if not nexts:
            break
        # Sin heurística espacial, elige el de menor id
        next_pos = min(nexts)
        visited.add(next_pos)
        path.append(next_pos)
        current = next_pos
        steps.append({
            'current': current,
            'visited': list(visited),
            'current_path': list(path),
            'queue': [current],
            'found': current == end
        })
        if current == end:
            break
    return steps