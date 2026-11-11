const calculateSurgePricing = (baseAmount) => {
  let surgePercentage = 0;

  const currentDate = new Date();
  const hour = currentDate.getHours();
  const day = currentDate.getDay();

  // Peak hours: 6 PM to 10 PM (20% surge)
  if (hour >= 18 && hour < 22) {
    surgePercentage += 20;
  }

  // Weekend: Saturday or Sunday (10% surge)
  if (day === 0 || day === 6) {
    surgePercentage += 10;
  }

  // Calculate surge amount
  const surgeAmount = (baseAmount * surgePercentage) / 100;

  // Calculate final amount
  const finalAmount = baseAmount + surgeAmount;

  return {
    baseAmount,
    surgePercentage,
    surgeAmount,
    finalAmount,
  };
};

module.exports = calculateSurgePricing;
