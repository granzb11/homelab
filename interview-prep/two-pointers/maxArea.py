class Solution:
    def maxArea(self, heights: List[int]) -> int:
        n = len(heights)
        max = 0

        l, r = 0, n-1

        while l < r:
            width = r - l
            height = min(heights[l], heights[r])
            sa = width * height
            if sa > max:
                max = sa
            
            print(f"width: {width} height: {height} sa: {sa} max: {max}")
            diff = heights[l] - heights[r]
            if heights[l] < heights[r]:
                l += 1
            else:
                r -= 1

        return max

        