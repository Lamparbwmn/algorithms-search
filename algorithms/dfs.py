from collections import deque
from .utils import vecinos_posibles

def search(grid, start, end):
    stack = [(start, [start])]
    visited = {start}
    steps = [{
        'current': start,
        'visited': list(visited),
        'current_path': [start],
        'queue': [start],
        'found': False
    }]
    while stack:
        current, path = stack.pop()
        if current == end:
            steps.append({
                'current': current,
                'visited': list(visited),
                'current_path': path,
                'queue': [pos for pos, _ in stack],
                'found': True
            })
            return steps
        for next_pos in vecinos_posibles(grid, current, visited):
            visited.add(next_pos)
            new_path = path + [next_pos]
            stack.append((next_pos, new_path))
            steps.append({
                'current': next_pos,
                'visited': list(visited),
                'current_path': new_path,
                'queue': [pos for pos, _ in stack],
                'found': False
            })
    return steps

def search_graph(nodes, edges, start, end=None):
    neighbors = {n['id']: [] for n in nodes}
    for a, b in edges:
        neighbors[a].append(b)
        neighbors[b].append(a)
    stack = [(start, [start])]
    visited = {start}
    steps = [{
        'current': start,
        'visited': list(visited),
        'current_path': [start],
        'queue': [start],
        'found': False
    }]
    while stack:
        current, path = stack.pop()
        if end is not None and current == end:
            steps.append({
                'current': current,
                'visited': list(visited),
                'current_path': path,
                'queue': [q[0] for q in stack],
                'found': True
            })
            return steps
        for next_pos in neighbors[current]:
            if next_pos not in visited:
                visited.add(next_pos)
                new_path = path + [next_pos]
                stack.append((next_pos, new_path))
                steps.append({
                    'current': next_pos,
                    'visited': list(visited),
                    'current_path': new_path,
                    'queue': [q[0] for q in stack],
                    'found': False
                })
    return steps