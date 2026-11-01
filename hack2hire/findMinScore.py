from typing import List, Optional

class Solution:
    def findMinScore(self, games: List[List[str]], threshold: float) -> int:
        map = {}  # Key: score, value: [totalCount, loseCount]
        totalCount = 0
        loseCount = 0

        # Count games and "lose" games for each score
        for game in games:
            gameScore = int(game[0])
            result = game[1]

            if gameScore in map:
                countArray = map[gameScore]
            else:
                countArray = [0, 0]
                map[gameScore] = countArray
            
            countArray[0] += 1
            
            if result == "lose":
                countArray[1] += 1
                loseCount += 1
            totalCount += 1

        if totalCount > 0 and loseCount / totalCount >= threshold:
            return 0

        sortedScores = list(map.keys())
        sortedScores.sort()

        remainingGameCount = totalCount
        remainingLoseCount = loseCount

        # Scan thresholds in increasing score order
        for score in sortedScores:
            countsForScore = map[score]
            remainingGameCount -= countsForScore[0]
            remainingLoseCount -= countsForScore[1]

            if remainingGameCount == 0:
                break  # No games left at or above this threshold

            loseRatio = remainingLoseCount / remainingGameCount
            if loseRatio >= threshold:
                return score + 1
        return -1