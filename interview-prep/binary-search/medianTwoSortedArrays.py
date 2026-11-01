class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        clen = len(nums1) + len(nums2)
        l1, l2 = 0, 0
        mid = clen // 2
        res = 0

        for i in range(0, mid + 1, 1):
            print(f"i: {i} l1: {l1} l2: {l2} mid: {mid} nums[l1]: {nums1[l1]} nums[l2]: {nums2[l2]}")
            if nums1[l1] < nums2[l2]:
                res = nums1[l1]
                l1 += 1
            else:
                res = nums2[l2]
                l2 += 1
            print(f"res: {res}\n\n")

        if (clen % 2) == 0:
            return (nums1[l1] + nums2[l2]) / 2
        else:
            return res