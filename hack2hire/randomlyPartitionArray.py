import random
from typing import List

class Solution:
    def randomlyPartition(self, nums: List[int], k: int) -> List[List[int]]:
        self.shuffle(nums)

        result = []
        segmentSize = len(nums) // k

        for i in range(k):
            segment = []
            for j in range(segmentSize):
                segment.append(nums[i * segmentSize + j])
            result.append(segment)

        return result

    # Shuffle the array using Fisher-Yates algorithm
    def shuffle(self, nums: List[int]) -> None:
        for i in range(len(nums) - 1, 0, -1):
            j = random.randint(0, i)
            
            temp = nums[i]
            nums[i] = nums[j]
            nums[j] = temp

if __name__ == "__main__":
    print("====== Test 1 ======")
    res1 = Solution().randomlyPartition([1, 2, 3, 4, 5, 6], 2)
    print(res1)
    # Expected: Two segments, each with 3 elements, like [1, 5, 6] and [4, 2, 3]

    print("====== Test 2 ======")
    res2 = Solution().randomlyPartition([1, 2, 3, 4], 4)
    print(res2)  # Expected: Four segments, each with 1 element, like [4], [2], [1], [3]

    print("====== Test 3 ======")
    res3 = Solution().randomlyPartition([1, 1, 2, 2], 2)
    print(res3)  # Expected: Two segments, each with 2 elements, like [1, 1] and [2, 2]

    print("====== Test 4 ======")
    res4 = Solution().randomlyPartition([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3)
    print(res4)
    # Expected: Three segments, each with 4 elements, like [1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]

    print("====== Test 5 ======")
    res5 = Solution().randomlyPartition([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], 4)
    print(res5)
    # Expected: Four segments, each with 4 elements, like [1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]