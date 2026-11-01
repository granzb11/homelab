from typing import List, Optional
import heapq

class Solution:
    def processOperations(self, operations: List[str], experiences: List[str], deltas: List[int]) -> List[str]:
        earningsMap = {}
        
        # highest earnings first -> lexicographically smallest name for tie-breaking
        # heapq is min heap, so negate earnings for max heap behavior
        maxHeap = []
        results = []

        for i in range(len(operations)):
            if operations[i] == "U":
                name = experiences[i]
                updated = earningsMap.get(name, 0) + deltas[i]
                earningsMap[name] = updated
                heapq.heappush(maxHeap, (-updated, name))
            else:
                # discard stale heap entries before reading the top
                while maxHeap and -maxHeap[0][0] != earningsMap[maxHeap[0][1]]:
                    heapq.heappop(maxHeap)
                results.append(maxHeap[0][1])

        return results