from typing import List, Optional

class Solution:
    def findMostFrequentCallStack(self, traces: List[str]) -> List[str]:
        stack = []
        stackCount = {}
        mostFrequent = ""
        maxCount, maxDepth = 0, 0
        

        for trace in traces:
            if trace.startswith("-> "):
                funcName = trace[3:]
                stack.append(funcName)

                # Record current stack state
                stackState = " -> ".join(stack)
                if stackState in stackCount:
                    stackCount[stackState][0] += 1
                    count = stackCount[stackState][0]
                    depth = stackCount[stackState][1]
                else:
                    count = 1
                    depth = len(stackState.split(" -> "))
                    stackCount[stackState] = [count, depth]

                if count > maxCount or (count == maxCount and depth > maxDepth):
                    mostFrequent = stackState
                    maxCount = count
                    maxDepth = depth

            elif trace.startswith("<- "):
                stack.pop()

        # Find most frequent stack with the deepest depth
        # mostFrequent = ""
        # maxCount = 0
        # maxDepth = 0
        # for stackState, count in stackCount.items():
        #     depth = len(stackState.split(" -> "))

        #     if count > maxCount or (count == maxCount and depth > maxDepth):
        #         maxCount = count
        #         maxDepth = depth
        #         mostFrequent = stackState

        return [mostFrequent, str(maxCount)]