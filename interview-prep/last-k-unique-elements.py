# Last K Unique Elements (LRU-style)

# Difficulty: Medium

# Design a data structure that tracks a stream of events and can return the K most recently seen distinct events, ordered from most recent to least recent. Adding an event that was already seen should move it to the "most recent" position without creating a duplicate entry.

# Implement the RecentUniqueTracker class:

# RecentUniqueTracker(int k) initializes the object with capacity k.
# void add(int event) records that event occurred.
# List<Integer> getRecent() returns up to k distinct events, most-recently-added first.

# Example:

# Input:
# ["RecentUniqueTracker", "add", "add", "add", "getRecent", "add", "getRecent"]
# [[2], [1], [2], [3], [], [1], []]

# Output:
# [null, null, null, null, [3, 2], null, [1, 3]]

# Explanation:
# k = 2
# add(1) -> events: [1]
# add(2) -> events: [2, 1]
# add(3) -> events: [3, 2] (1 evicted, capacity 2)
# getRecent() -> [3, 2]
# add(1) -> events: [1, 3] (1 is new-ish again, 2 evicted)
# getRecent() -> [1, 3]

# Constraints:

# 1 <= k <= 10^4
# 1 <= event <= 10^9
# At most 10^5 calls total to add and getRecent.
# All operations should run in O(1) amortized time.


# Each value is stored in a doubly linked list node so we can move it to the front
# or evict it from the tail in O(1) time. The hash map gives us direct access to
# the node for a value without scanning the list.
class _Node:
    __slots__ = ("value", "prev", "next")

    def __init__(self, value: int):
        self.value = value
        self.prev = None
        self.next = None


class RecentUniqueTracker:
    """Tracks the k most recently seen distinct values in O(1) time.

    Strategy: maintain a doubly linked list ordered from most recent to least recent,
    and a hash map from event -> node. Moving an existing event to the front and
    evicting the least-recent unique event are both constant-time operations.
    """

    def __init__(self, k: int):
        self.k = k
        self.size = 0
        self.lookup = {}

        # Sentinel nodes make list operations simpler and avoid edge-case checks.
        self.head = _Node(-1)
        self.tail = _Node(-1)
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: _Node) -> None:
        # Unlink the node from the doubly linked list.
        node.prev.next = node.next
        node.next.prev = node.prev
        node.prev = None
        node.next = None

    def _insert_front(self, node: _Node) -> None:
        # Insert the node immediately after the dummy head, making it the newest item.
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node

    def add(self, event: int) -> None:
        # If this value was seen recently, move it to the front instead of duplicating it.
        if event in self.lookup:
            node = self.lookup[event]
            self._remove(node)
            self._insert_front(node)
            return

        # If the tracker is full, evict the oldest distinct event from the tail.
        if self.size == self.k:
            least_recent = self.tail.prev
            self._remove(least_recent)
            del self.lookup[least_recent.value]
            self.size -= 1

        # Add the new event as the most recent value.
        node = _Node(event)
        self._insert_front(node)
        self.lookup[event] = node
        self.size += 1

    def getRecent(self):
        # Walk from the head to the tail and collect the current order.
        values = []
        current = self.head.next
        while current is not self.tail:
            values.append(current.value)
            current = current.next
        return values


if __name__ == "__main__":
    tracker = RecentUniqueTracker(2)
    tracker.add(1)
    tracker.add(2)
    tracker.add(3)
    print(tracker.getRecent())  # [3, 2]
    tracker.add(1)
    print(tracker.getRecent())  # [1, 3]
