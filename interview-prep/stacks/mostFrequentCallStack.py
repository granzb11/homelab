from collections import Counter
from typing import List, Tuple


def solution(logs: List[str]) -> Tuple[str, int]:
    stack = []
    counts = Counter()

    for entry in logs:
        event, name = entry[:2], entry[2:]
        if event == "->":
            stack.append(name)
            counts["->".join(stack)] += 1
        else:
            stack.pop()

    if not counts:
        return ("", 0)

    neg_count, snapshot = min((-count, snap) for snap, count in counts.items())
    return (snapshot, -neg_count)


if __name__ == "__main__":
    print(solution(['->A', '->B', '->C', '<-C', '->C', '<-C', '<-B', '<-A']))  # ("A->B->C", 2)
    print(solution(['->A', '<-A', '->A', '<-A', '->B', '<-B']))  # ("A", 2)
    print(solution(['->A', '->A', '<-A', '->A', '<-A', '<-A']))  # ("A->A", 2)
    print(solution(['->B', '<-B', '->A', '<-A', '->C', '<-C']))  # ("A", 1)
    print(solution([]))  # ("", 0)
