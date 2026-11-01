class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:

        if not nums:
            return 0

        nums.sort()
        res = streak = 1       
        prev = nums[0]

        for i in range(1, len(nums), 1):
            # print(f"i: {i} nums[i]: {nums[i]}  prev: {prev} streak: {streak} res: {res}")
            if nums[i] == prev:
                continue            
            elif nums[i] - 1 != prev:
                res = max(res, streak)
                streak = 0
            
            prev = nums[i]
            streak += 1
            res = max(res, streak)

            # print(f"streak: {streak} res: {res}\n\n")

        return res
