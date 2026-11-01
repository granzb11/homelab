# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    # self.right_depth = 0
    def rightSideView(self, root: Optional[TreeNode]) -> List[int]:
        res = []
        right_depth = 0

        def dfs(root: Optional[TreeNode], curr_depth):
            if not root:
                return None

            if curr_depth == right_depth:
                res.append(root.val)
                right_depth += 1
            
            dfs(root.right, curr_depth+1)
            dfs(root.left, curr_depth+1)

            
        dfs(root, 0)

        return res