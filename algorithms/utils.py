def manhattan_distance(p1, p2):
    return abs(p1[0] - p2[0]) + abs(p1[1] - p2[1])


def vecinos_posibles(grid, pos, visitados):
    rows, cols = len(grid), len(grid[0])
    r, c = pos
    vecinos = []
    for dr, dc in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
        nr, nc = r + dr, c + dc
        if (0 <= nr < rows and 0 <= nc < cols and
                grid[nr][nc] != 1 and (nr, nc) not in visitados):
            vecinos.append((nr, nc))
    return vecinos