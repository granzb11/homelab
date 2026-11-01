from collections import defaultdict, deque
from typing import DefaultDict, Deque


class RequestLogger:
    """Counts requests per user within a trailing time window.

    For each user, we keep a deque of timestamps in non-decreasing order.
    The window is defined as (currentTime - windowSize, currentTime], so entries
    at exactly currentTime - windowSize are too old and must be ignored.
    """

    def __init__(self, windowSize: int):
        self.windowSize = windowSize
        self.requests: DefaultDict[int, Deque[int]] = defaultdict(deque)

    def record(self, userId: int, timestamp: int) -> None:
        self.requests[userId].append(timestamp)

    def count(self, userId: int, currentTime: int) -> int:
        q = self.requests.get(userId)
        if not q:
            return 0

        cutoff = currentTime - self.windowSize
        while q and q[0] <= cutoff:
            q.popleft()

        return len(q)


if __name__ == "__main__":
    logger = RequestLogger(10)
    logger.record(1, 5)
    logger.record(1, 8)
    logger.record(1, 12)
    print(logger.count(1, 15))  # 2
    logger.record(1, 20)
    print(logger.count(1, 25))  # 1
