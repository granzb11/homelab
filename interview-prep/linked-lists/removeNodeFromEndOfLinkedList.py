# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
        curr = head

        if head.next == None:
            return ListNode()

        while curr:
            i, temp = 0, curr            

            while i < n and temp.next:                
                temp = temp.next
                print(f"i: {i} curr: {curr.val} temp: {temp.val}")
                i += 1

            print("\n\n")

            if temp.next == None:
                curr.next = temp
                break
            
            curr = curr.next

        return head
        