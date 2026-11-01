class Solution:
    def findMin(self, nums: List[int]) -> int:
        res = nums[0]

        l, r = 0, len(nums)-1

        while l <= r:
            mid = (l+r)//2
            temp = nums[mid]

            print(f"l: {l} r: {r} mid: {mid} temp: {temp} nums[r]: {nums[r]}")

            if temp > nums[r]:
                res = temp
                l = mid + 1
            else:
                res = min(temp, res)
                r = mid - 1

            print(f"l: {l} r: {r} mid: {mid} temp: {temp} res: {res}\n\n")

        return res