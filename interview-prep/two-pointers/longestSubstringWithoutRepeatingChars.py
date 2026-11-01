class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        res = 0

        l, r = 0, 0
        sub = []
        for i in range(len(s)):
            print(f"s[i]: {s[i]} l: {l} i: {i} sub: {sub} res: {res}")
            if s[i] in sub:                
                res = max(res, len(sub))
                while s[l] != s[i]:
                    print(f"s[l]: {s[l]}")
                    sub.remove(s[l])
                    l += 1
            else:
                sub.append(s[i])
                res = max(res, len(sub))
        return res
        