from typing import List

class Solution:
    def findMostFrequentCallStack(self, traces: List[str]) -> List[str]:
        # trie node: [parent, funcName, depth, count]
        root = [None, "", 0, 0]
        node = root
        children_cache = {}  # id(parent) -> {funcName: child_node}

        best_node = None
        maxCount, maxDepth = 0, 0

        for trace in traces:
            if trace.startswith("-> "):
                funcName = trace[3:]
                children = children_cache.setdefault(id(node), {})
                child = children.get(funcName)
                if child is None:
                    child = [node, funcName, node[2] + 1, 0]
                    children[funcName] = child
                node = child
                node[3] += 1  # count
                count, depth = node[3], node[2]

                if count > maxCount or (count == maxCount and depth > maxDepth):
                    best_node = node
                    maxCount, maxDepth = count, depth
            else:  # "<- "
                node = node[0]

        # Reconstruct the winning path only once, O(D)
        parts = []
        n = best_node
        while n and n[1]:
            parts.append(n[1])
            n = n[0]
        mostFrequent = " -> ".join(reversed(parts))

        return [mostFrequent, str(maxCount)]
