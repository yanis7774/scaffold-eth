import React, { useState } from "react";
import { Typography, Button, Row } from "antd";

const { Title, Text } = Typography;

export default function EvaluatorView(props) {
    const signYesTransaction = () => {
        console.log("Signed the YES transaction!")
    }
    const signNoTransaction = () => {
        console.log("Signed the NO transaction!")
    }

  return (
    <>
      <Title>Evaluator UI</Title>
      <Text>{props.question}</Text>
      <div>
        <Button onClick={signYesTransaction}>Yes</Button>
        <Button onClick={signNoTransaction}>No</Button>
      </div>
    </>
  );
}
