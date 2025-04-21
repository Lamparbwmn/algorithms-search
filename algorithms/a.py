from collections import deque

#################
def a(grid, start, end):
    rows, cols = len(grid), len(grid[0])
    queue = deque([start])
    visited = set()
    came_from = {start: None}

    while queue:
        current = queue.popleft()

        if current == end:
            path = []
            while current:
                path.append(current)
                current = came_from[current]
            return path[::-1]

        for dr, dc in [(0, 1), (1, 0), (0, -1), (-1, 0)]:  # Direcciones
            neighbor = (current[0] + dr, current[1] + dc)

            if (0 <= neighbor[0] < rows and 0 <= neighbor[1] < cols
                    and grid[neighbor[0]][neighbor[1]] == 0
                    and neighbor not in visited):
                queue.append(neighbor)
                visited.add(neighbor)
                came_from[neighbor] = current

    return []  # No hay camino