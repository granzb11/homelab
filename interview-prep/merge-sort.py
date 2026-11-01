# You're building a system that receives fragments of a message over an
# unreliable channel. Each fragment arrives as a tuple:

#     (sequence_id: int, payload: str)

# Fragments can arrive out of order, and the same sequence_id may be
# delivered more than once (duplicates should not corrupt the result).

# Write a class/function that:
# 1. Accepts fragments one at a time via `receive(sequence_id, payload)`
# 2. Knows the total expected number of fragments (`total_fragments`)
#    up front
# 3. Exposes `is_complete()` -> bool
# 4. Exposes `assemble()` -> str, which returns the fragments joined
#    in correct sequence order, but only once complete

# Example:
#     receive(2121, "world")
#     receive(0999, "hello ")
#     receive(1010, "brave ")
#     receive(2121, "world")   # duplicate — should not cause false completion
#     is_complete()  # -> True (only after all 3 unique ids 0,1,2 received)
#     assemble()     # -> "hello brave world"


import bisect


class MessageAssembler:
    def __init__(self, total_fragments: int):
        self.total_fragments = total_fragments
        self.fragments = {}
        # maintain a sorted list of received sequence ids as we get them
        self.ordered_ids = []

    def receive(self, sequence_id: int, payload: str) -> bool:
        # dedupe: duplicates are a no-op, not an error
        if sequence_id in self.fragments:
            return True

        # store payload and insert sequence id into ordered list
        self.fragments[sequence_id] = payload
        bisect.insort(self.ordered_ids, sequence_id)
        return True

    def is_complete(self) -> bool:
        return len(self.fragments) == self.total_fragments

    def assemble(self) -> str:
        if not self.is_complete():
            raise ValueError(
                f"Cannot assemble: have {len(self.fragments)}/"
                f"{self.total_fragments} fragments"
            )

        # dict keys already give O(1) dedup; sorting them here is all
        # the "ordering" logic assemble() needs.
        # use the maintained ordered list (already sorted on receive)
        if self.ordered_ids:
            ordered_ids = self.ordered_ids
        else:
            ordered_ids = _merge_sort(list(self.fragments.keys()))

        parts = []
        for seq_id in ordered_ids:
            parts.append(self.fragments[seq_id])

        return "".join(parts)


def _merge_sort(values: list) -> list:
    if len(values) <= 1:
        return values

    mid = len(values)//2
    left = _merge_sort(values[:mid])
    right = _merge_sort(values[mid:])
    merged = _merge(left, right)

    return merged


def _merge(left: list, right: list) -> list:
    merged = []
    i=j=0

    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1

    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged



if __name__ == "__main__":
    m = MessageAssembler(total_fragments=8)
    m.receive(2, "world")
    m.receive(0, "hello ")
    m.receive(7, "is ")
    m.receive(5, "it ")
    m.receive(1, "brave ")
    m.receive(2, "world ")  # duplicate — should not cause false completion
    m.receive(7, "is ")
    m.receive(6, "is ")
    m.receive(4, "what ")
    m.receive(3, "new ")
    print(m.is_complete())  # -> True
    print(m.assemble())
