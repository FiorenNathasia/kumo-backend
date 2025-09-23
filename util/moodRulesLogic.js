const moodRules = {
  devastated: { categories: ["Relax", "Connect", "Reflect"], energy: 1 },
  sad: { categories: ["Relax", "Connect", "Create"], energy: 1 },
  neutral: { categories: ["Focus", "Organize"], energy: 2 },
  happy: { categories: ["Create", "Connect", "Fun"], energy: 3 },
  enthusiastic: { categories: ["Focus", "Create", "Move"], energy: 3 },
  anxious: { categories: ["Relax", "Reflect"], energy: 2 },
  frustrated: { categories: ["Move", "Organize"], energy: 2 },
  exhausted: { categories: ["Relax", "Fun"], energy: 1 },
  stressed: { categories: ["Relax", "Reflect", "Move"], energy: 1 },
  relaxed: { categories: ["Create", "Fun", "Connect"], energy: 3 },
};

function combinedMoods(selectedMoods) {
  let allCategories = [];
  let totalEnergy = 0;

  selectedMoods.forEach((mood) => {
    const rules = moodRules[mood];
    totalEnergy += rules.energy;

    allCategories = [...allCategories, ...rules.categories];
  });

  const catObj = allCategories.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {});

  allCategories.forEach((cat) => {
    catObj[cat] += 1;
  });

  const sortedCat = Object.fromEntries(
    Object.entries(catObj).sort((a, b) => b[1] - a[1])
  );

  const avgEnergyLevel = totalEnergy / selectedMoods.length;

  return {
    sortedCat,
    avgEnergyLevel,
  };
}

module.exports = {
  combinedMoods,
};
