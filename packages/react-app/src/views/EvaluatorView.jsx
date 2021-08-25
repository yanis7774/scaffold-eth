import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Safe, { EthersAdapter, SafeFactory, SafeTransaction, TransactionOptions } from "@gnosis.pm/safe-core-sdk";
import { Typography, Button, Row, Divider } from "antd";
import SafeServiceClient from "@gnosis.pm/safe-service-client";
import { ColumnWidthOutlined } from "@ant-design/icons";
import { TransactionDescription } from "ethers/lib/utils";
import { EthSignSignature } from "./EthSignSignature";

const { Title, Text } = Typography;
const serviceClient = new SafeServiceClient("https://safe-transaction.rinkeby.gnosis.io/");

export default function EvaluatorView({ config, safeAddress, userAddress, userSigner }) {
  const { evaluators, threshold, beneficiary } = config;

  const [yesTransaction, setYesTransaction] = useState(false);
  const [noTransaction, setNoTransaction] = useState(false);
  const [safeSdk, setSafeSdk] = useState();
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(async () => {
    if (userSigner) {
      const ethAdapter = new EthersAdapter({ ethers, signer: userSigner });
      const id = await ethAdapter.getChainId();
      const contractNetworks = {
        [id]: {
          multiSendAddress: safeAddress,
          safeMasterCopyAddress: safeAddress,
          safeProxyFactoryAddress: safeAddress,
        },
      };
      const safeSdk = await Safe.create({ ethAdapter, safeAddress, contractNetworks });
      setSafeSdk(safeSdk);
    }
  }, [userSigner]);

  useEffect(async () => {
    if (!transactionsLoaded) {
      const { results } = await serviceClient.getPendingTransactions(safeAddress);
      if (results.length < 2) {
        setDone(true);
      }
      setYesTransaction(results.find(_ => _.to.toLowerCase() === beneficiary.toLowerCase()));
      setNoTransaction(results.find(_ => _.to.toLowerCase() !== beneficiary.toLowerCase()));
      setTransactionsLoaded(true);
      console.log(yesTransaction);
    }
  });

  const signTransaction = async transaction => {
    const hash = transaction.safeTxHash;
    const signature = await safeSdk.signTransactionHash(hash);
    await serviceClient.confirmTransaction(hash, signature.data);
    console.log("Signed the transaction!");
    setTransactionsLoaded(false);
  };

  const executeTransaction = async transaction => {
    console.log(transaction);
    const safeTransactionData = {
      to: transaction.to,
      value: transaction.value,
      data: transaction.data || "0x",
      operation: transaction.operation,
      safeTxGas: transaction.safeTxGas,
      baseGas: transaction.baseGas,
      gasPrice: Number(transaction.gasPrice),
      gasToken: transaction.gasToken,
      refundReceiver: transaction.refundReceiver,
      nonce: transaction.nonce,
    };
    const safeTransaction = await safeSdk.createTransaction(safeTransactionData);
    transaction.confirmations.forEach(confirmation => {
      safeTransaction.addSignature(new EthSignSignature(confirmation.owner, confirmation.signature));
    });
    const executeTxResponse = await safeSdk.executeTransaction(safeTransaction);
    const receipt = executeTxResponse.transactionResponse && (await executeTxResponse.transactionResponse.wait());
    console.log(receipt);
  };

  const addressHasSigned = address =>
    [yesTransaction, noTransaction].reduce(
      (acc, transaction) => acc || transaction.confirmations.map(_ => _.owner).includes(address),
      false,
    );

  const getExecutableTransaction = () => {
    if (yesTransaction.confirmations.length >= threshold) {
      return yesTransaction;
    } else if (noTransaction.confirmations.length >= threshold) {
      return noTransaction;
    }
    return false;
  };

  const Transaction = transaction => (
    <div>
      <Text key={transaction.safeTxHash}>{transaction.safeTxHash}</Text>
    </div>
  );

  return (
    <>
      <Title level={3}>Evaluator</Title>
      {done ? (
        <Title lever={1}>Concluded! Nothing to see here!</Title>
      ) : (
        <>
          <Title lever={1}>{config.question}</Title>
          {transactionsLoaded ? (
            getExecutableTransaction() ? (
              <Button onClick={() => executeTransaction(getExecutableTransaction())}>Execute</Button>
            ) : evaluators.includes(userAddress) ? (
              addressHasSigned(userAddress) ? (
                <Text>You have already answered this</Text>
              ) : (
                <div>
                  <Button onClick={() => signTransaction(yesTransaction)}>Yes</Button>
                  <Button onClick={() => signTransaction(noTransaction)}>No</Button>
                </div>
              )
            ) : (
              <div>
                <Text>You are not a evaluator.</Text>
              </div>
            )
          ) : (
            <Text>Loading</Text>
          )}
        </>
      )}
    </>
  );
}
