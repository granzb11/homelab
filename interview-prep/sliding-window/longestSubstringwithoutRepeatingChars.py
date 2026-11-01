class Solution:
    def lengthOfLongestSubstring(self, s: str, debug: bool = False) -> int:
        charSet = set()
        l = 0
        res = 0

        for r in range(len(s)):
            while s[r] in charSet:
                charSet.remove(s[l])
                l += 1
            charSet.add(s[r])
            res = max(res, r - l + 1)

            if debug:
                print(f"l: {l} r: {r} res: {res} charSet: {charSet}")

        return res
