from typing import List, Optional

class TrieNode:
    def __init__(self):
        self.children = {}
        self.isEnd = False

class Solution:
    def removePrefix(self, words: List[str]) -> List[str]:
        root = TrieNode()

        # Insert all words into Trie
        for word in words:
            curr = root
            for c in word:
                if c not in curr.children:
                    curr.children[c] = TrieNode()
                curr = curr.children[c]
            curr.isEnd = True

        result = []

        # Check each word if it's a prefix of any other word
        for word in words:
            curr = root
            for c in word:
                curr = curr.children[c]
            if not curr.children:
                result.append(word)

        return result