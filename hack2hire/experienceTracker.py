import heapq
from typing import List, Optional


class _MaxKey:
    """Heap key: pops highest earning first, ties broken by largest experience."""
    __slots__ = ("earning", "experience")

    def __init__(self, earning, experience):
        self.earning = earning
        self.experience = experience

    def __lt__(self, other):
        if self.earning != other.earning:
            return self.earning > other.earning
        return self.experience > other.experience


class Solution:
    def processOperations(self, operations: List[str], experiences: List[str], deltas: List[int]) -> List[str]:
        self.earnings = {}
        self.heap = []
        results = []

        for i in range(len(operations)):
            if operations[i] == "U":
                self.update(experiences[i], deltas[i])
            else:
                results.append(self.query())

        return results

    def update(self, experience, earning):
        if experience in self.earnings:
            self.earnings[experience] += earning
        else:
            self.earnings[experience] = earning

        # Push the experience's up-to-date earning; stale entries left behind
        # by earlier pushes are discarded lazily in query().
        heapq.heappush(self.heap, _MaxKey(self.earnings[experience], experience))

    def query(self):
        while self.heap and self.heap[0].earning != self.earnings.get(self.heap[0].experience):
            heapq.heappop(self.heap)
        return self.heap[0].experience if self.heap else ""
