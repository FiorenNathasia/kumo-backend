function aiRecommendation(combined) {
  const { avgEnergyLevel, sortedCat } = combined;
  let taskCount;
  let difficulty;

  if (avgEnergyLevel <= 1.5) {
    taskCount = "1-2";
    difficulty = "easy";
  } else if (avgEnergyLevel <= 2.4) {
    taskCount = "2-3";
    difficulty = "medium";
  } else if (avgEnergyLevel >= 2.5) {
    taskCount = "3-5";
    difficulty = "hard";
  }
  return { taskCount, difficulty, avgEnergyLevel, sortedCat };
}

module.exports = {
  aiRecommendation,
};
