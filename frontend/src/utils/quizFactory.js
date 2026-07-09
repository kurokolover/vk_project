export function createEmptyQuestion() {
  return {
    id: crypto.randomUUID(),
    title: "",
    type: "text",
    imageUrl: "",
    choiceMode: "single",
    timeLimit: 30,
    points: 1000,
    options: [
      { id: crypto.randomUUID(), text: "", correct: true },
      { id: crypto.randomUUID(), text: "", correct: false }
    ]
  };
}

export function createOption(text = "", correct = false) {
  return {
    id: crypto.randomUUID(),
    text,
    correct
  };
}
