from collections import defaultdict, deque

def validate_fault_causal_relationships(fault_ids, edges):
    outgoing_edges = defaultdict(list)
    indegree = {fid: 0 for fid in fault_ids}

    for edge in edges:
        a = edge["cause_fault_id"]
        b = edge["effect_fault_id"]

        if a == b:
            raise ValueError(f"Self-loop is not allowed: {a}")

        if a not in indegree or b not in indegree:
            raise ValueError(f"Unknown fault reference in edge: {a} -> {b}")

        outgoing_edges[a].append(b)
        indegree[b] += 1

    queue = deque(fid for fid, degree in indegree.items() if degree == 0)
    visited = 0

    while queue:
        node = queue.popleft()
        visited += 1
        for child in outgoing_edges[node]:
            indegree[child] -= 1
            if indegree[child] == 0:
                queue.append(child)

    if visited != len(fault_ids):
        raise ValueError("Fault causal relationships contain a directed cycle.")

    return True
