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
  //Initialize and emptry array to the variable allCategories
  let allCategories = [];
  //Set the variable totalEnergy to 0
  let totalEnergy = 0;

  //Loop through each mood
  selectedMoods.forEach((mood) => {
    //Match the mood from selectedMoods to the ones found in moodRules
    const rules = moodRules[mood];
    //Add up all the enery from the found mood matches to the totalEnergy variable
    totalEnergy += rules.energy;

    //Add all the categories from the match to the empty allCategories array
    allCategories = [...allCategories, ...rules.categories];
  });

  //Use reduce to...
  //1. Get rid of duplicates of categories
  //2. Set each category as the keys with the value 0
  //3. Return everything as an object
  const catObj = allCategories.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {});

  //Use foreach to...
  //Everytime there is a match of the cattegory, add 1 to its value
  allCategories.forEach((cat) => {
    catObj[cat] += 1;
  });

  //Use sort to...
  //Sort the key's of the object from the one with the highest value to the least
  const sortedCat = Object.fromEntries(
    Object.entries(catObj).sort((a, b) => b[1] - a[1])
  );

  //Get the average of all the energy level
  const avgEnergyLevel = totalEnergy / selectedMoods.length;

  //Return both the sortedCat object and avgEnergyLevel
  return {
    sortedCat,
    avgEnergyLevel,
  };
}

module.exports = {
  combinedMoods,
};
