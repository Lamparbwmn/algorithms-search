def search(grid, start, end):
    rows, cols = len(grid), len(grid[0])
    stack = [start]
    visited = set()
    came_from = {}
    visited.add(start)

    while stack:
        current = stack.pop()
        if current == end:
            break

        for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
            r, c = current[0] + dr, current[1] + dc
            neighbor = (r, c)

            if 0 <= r < rows and 0 <= c < cols and grid[r][c] == 0 and neighbor not in visited:
                stack.append(neighbor)
                visited.add(neighbor)
                came_from[neighbor] = current

    # Reconstruir el camino
    path = []
    if end in came_from:
        node = end
        while node != start:
            path.append(node)
            node = came_from[node]
        path.append(start)
        path.reverse()

    return list(visited), path
