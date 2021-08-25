module.exports = {
  ethAmountToSend: "0.001",
  beneficiary: "0xD028d504316FEc029CFa36bdc3A8f053F6E5a6e4",
  evaluators: ["0xD028d504316FEc029CFa36bdc3A8f053F6E5a6e4", "0xac78927A0F35989be259622047388c0A1A99e4aD", "0x85ac549bc7f1618eec49336070e0b3d722eac906"],
  threshold: 2,
  // The yes or no question to display to evaluators
  //  Yes: the work is done and the money should be transferred to the worker
  //  No: The work is not done the payment should be transferred back to the sender
  question: "Did the the developer fix bug #123?",
};
