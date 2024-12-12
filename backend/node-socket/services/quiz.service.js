
const calculateScore = (answers) => {
    let score = 0;
    let total = answers.length;
  
    answers.forEach((answer) => {
      if (answer.correct) {
        score += 1;
      }
    });
  
    return { total, score };
  };
  
  module.exports = { calculateScore };
  