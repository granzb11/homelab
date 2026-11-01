# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
        # checking if both nodes are None 
        if not p and not q: 
            return True
        # checking if one of the nodes is None
        if not p or not q:
            return False
        # checking if the values of the nodes are different
        if p.val != q.val:
            return False

        left_same = self.isSameTree(p.left, q.left)
        right_same = self.isSameTree(p.right, q.right)
        
        # recursively checking the left and right subtrees
        return left_same and right_same
        