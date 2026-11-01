from collections import defaultdict
from typing import List

class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        groups = {}

        res = defaultdict(list)
        print(res)

        # for word in strs:
        #     sorted_word = "".join(sorted(word))
        #     print(f"word: {word} sorted_word: {sorted_word}")
        #     if sorted_word in groups:
        #         curr = groups[sorted_word]
        #         curr = curr.append(word)
        #         print(f"curr: {curr}")
        #         groups[sorted_word] = groups[sorted_word].append(word)
        #     else:
        #         groups[sorted_word] = [word]

        #     print(f"groups: {groups}\n\n")

        # results = []
        # for key, value in groups.items():
        #     results.append(value)

        # return results
        

if __name__ == "__main__":
    words = ["eat", "tea", "tan", "ate", "nat", "bat"]
    solution = Solution()
    solution.groupAnagrams(words)