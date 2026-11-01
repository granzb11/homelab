class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        maxProfit = 0
        for i in range(len(prices)):
            l, r = i, len(prices)-1

            while l < r:
                profit = prices[r] - prices[l]
                maxProfit = max(maxProfit, profit)
            
                r -= 1

        return maxProfit