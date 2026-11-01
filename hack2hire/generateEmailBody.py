from typing import List, Optional

class Solution:
    def generateEmailBody(self, detectedWords: List[str], categories: List[List[str]], instructions: List[List[str]]) -> List[List[str]]:
        # TODO: Implement generateEmailBody logic        
        if len(detectedWords) == 0:
            return []
   
        # keyword => category
        keywordToCategory = {}
        for cat in categories:
            keywordToCategory[cat[0]] = cat[1]

        # category => instruction
        categoryToInstruction = {}
        for instruction in instructions:
            categoryToInstruction[instruction[0]] = instruction[1].strip()

        categoryOrder = []
        categoryKeywords = {}

        for word in detectedWords:
            category = keywordToCategory.get(word)
            if category is not None:
                if category not in categoryKeywords:
                    categoryOrder.append(category)
                    categoryKeywords[category] = set()
                categoryKeywords[category].add(word)

        result = []
        for category in categoryOrder:
            categoryResult = []

            sortedCategoryKeywords = list(categoryKeywords[category])
            sortedCategoryKeywords.sort()
            

            detectStr = f"Detected Keywords: {', '.join(sortedCategoryKeywords)}"
            instructStr = f"Instruction: {categoryToInstruction[category]}"
            
            result.append([detectStr, instructStr])

        return result






