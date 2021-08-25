import React, { useState } from "react";
import { Typography, Button, Row } from "antd";
import SafeServiceClient from "@gnosis.pm/safe-service-client";

const { Title, Text } = Typography;
const serviceClient = new SafeServiceClient("https://safe-transaction.rinkeby.gnosis.io/");

export default function EvaluatorView({ config, safeAddress, userAddress }) {
  const [transactions, setTransactions] = useState([]);

  serviceClient.getPendingTransactions(safeAddress).then(({ results }) => {
    console.log(results);
    setTransactions(results);
  });

  const signYesTransaction = () => {
    console.log("Signed the YES transaction!");
  };
  const signNoTransaction = () => {
    console.log("Signed the NO transaction!");
  };

  const Transaction = transaction => (
    <div>
      <Text>{transaction.safeTxHash}</Text>
    </div>
  );

  return (
    <>
      <Title>Evaluator UI</Title>
      <Text>{config.question}</Text>
      {/* {owners.includes(address) && !transaction.signers.includes(address)){ */}
      <div>
        <Button onClick={signYesTransaction}>Yes</Button>
        <Button onClick={signNoTransaction}>No</Button>
      </div>
{/* } */}
      <Text>{safeAddress}</Text>
      <Title level={3}>Transactions</Title>
      {transactions.map(Transaction)}
    </>
  );
}
