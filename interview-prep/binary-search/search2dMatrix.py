class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        l, r = 0, len(matrix)-1

        while l <= r:
            mid = l + ((r-l)//2)
            midMin = matrix[mid][0]
            midMax = matrix[mid][-1]

            if target >= midMin and target <= midMax:
                return self.binarySearch(matrix[mid], target)
            elif target > midMax:
                l = mid + 1
            else:
                r = mid - 1
        
        return False

    def binarySearch(self, nums: List[int], target):
        l, r = 0, len(nums)-1

        while l <= r:
            mid = l + ((r-l)//2)
            if target > nums[mid]:
                l = mid + 1
            elif target < nums[mid]:
                r = mid - 1
            else:
                return True
        
        return False