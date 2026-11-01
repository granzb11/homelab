
class Solution:
    def findBestStartingIndex(self, nums: List[int], targetIndex: int, windowSize: int) -> int:
        n = len(nums)
        target = nums[targetIndex]
        count = 0

        # Count target in the first window
        for i in range(windowSize):
            if nums[i] == target:
                count += 1

        maxCount = count
        bestIdx = 0

        # Slide the window
        for i in range(1, n - windowSize + 1):
            if nums[i - 1] == target:
                count -= 1
            if nums[i + windowSize - 1] == target:
                count += 1
            if count > maxCount:
                maxCount = count
                bestIdx = i
        
        return bestIdx