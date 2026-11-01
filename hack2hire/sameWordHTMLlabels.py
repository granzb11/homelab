class HtmlLabel:
    def __init__(self, text):
        self.text = text
        self.children = None

class Solution:
    def sameWordOfHtmlLabels(self, root1, root2):
        str1 = self.getLeafConcatenation(root1)
        str2 = self.getLeafConcatenation(root2)
        return str1 == str2

    def getLeafConcatenation(self, root):
        if root is None:
            return ""

        result = []
        stack = []
        stack.append(root)

        while stack:
            current = stack.pop()

            # If it's a leaf node (has text and no children or empty children)
            if (current.text is not None and current.text != "" and 
                (current.children is None or len(current.children) == 0)):
                result.append(current.text)

            # Add children to stack in reverse order for left-to-right traversal
            if current.children is not None:
                for i in range(len(current.children) - 1, -1, -1):
                    if current.children[i] is not None:
                        stack.append(current.children[i])

        return "".join(result)

def main():
    test1()
    test2()
    test3()
    test4()
    test5()

def test1():
    print("===== Test 1: =====")

    # Label 1:
    # <root>
    #     <container>
    #         <div> "He" </div>
    #         <div> "llo" </div>
    #     </container>
    #     <p> "World" </p>
    # </root>

    he = HtmlLabel("He")
    llo = HtmlLabel("llo")
    container1 = HtmlLabel(None)
    container1.children = [he, llo]

    world = HtmlLabel("World")
    label1 = HtmlLabel(None)
    label1.children = [container1, world]

    # Label 2:
    # <root>
    #     <div> "Hello" </div>
    #     <container>
    #         <span> "Wor" </span>
    #         <span> "ld" </span>
    #     </container>
    # </root>

    wor = HtmlLabel("Wor")
    ld = HtmlLabel("ld")
    container2 = HtmlLabel(None)
    container2.children = [wor, ld]

    hello = HtmlLabel("Hello")
    label2 = HtmlLabel(None)
    label2.children = [hello, container2]

    res1 = Solution().sameWordOfHtmlLabels(label1, label2)
    print(res1)  # Expected: true