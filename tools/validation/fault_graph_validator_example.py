from collections import defaultdict, deque

def validate_no_fault_cycles(fault_ids, edges):
    graph = defaultdict(list)
    indegree = {fid: 0 for fid in fault_ids}

    for edge in edges:
        a = edge["cause_fault_id"]
        b = edge["effect_fault_id"]

        if a == b:
            raise ValueError(f"Self-loop is not allowed: {a}")

        if a not in indegree or b not in indegree:
            raise ValueError(f"Unknown fault reference in edge: {a} -> {b}")

        graph[a].append(b)
        indegree[b] += 1

    queue = deque(fid for fid, degree in indegree.items() if degree == 0)
    visited = 0

    while queue:
        node = queue.popleft()
        visited += 1
        for child in graph[node]:
            indegree[child] -= 1
            if indegree[child] == 0:
                queue.append(child)

    if visited != len(fault_ids):
        raise ValueError("Fault causal graph contains a directed cycle.")

    return True
