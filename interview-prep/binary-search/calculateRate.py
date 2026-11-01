class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        l, r = 1, max(piles)
        minRate = r
        
        while l <= r:            
            mid = (l + r) // 2            

            print(f"l: {l} r: {r} mid: {mid}")

            hours = 0
            for pile in piles:
                hours += math.ceil(float(pile) / mid)

            # print(f"hours: {hours}")

            if hours <= h:
                minRate = mid
                r = mid - 1
                
            else:
                l = mid + 1

            print(f"l: {l} r: {r} hours: {hours}")
            # print(f"minRate: {minRate}")

        return minRate
            