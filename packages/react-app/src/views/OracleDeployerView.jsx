import React, { useState } from "react";
import { Form, Input, Divider, Button, Typography, Row, Col, Spin, Steps } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { DeleteOutlined } from "@ant-design/icons";
import { BytesStringInput, AddressInput, EtherInput } from "../components";
import { deploy as deployOracle } from "./oracleDeploy";
const { Title } = Typography;
import { withRouter } from "react-router-dom";

import { Redirect } from "react-router-dom";

function OracleDeployerView({ mainnetProvider, tx, writeContracts, price, address, userSigner, history }) {
  const [beneficiary, setBeneficiary] = useState("");
  const [evaluators, setEvaluators] = useState([""]);
  const [threshold, setThreshold] = useState();
  const [ethAmount, setEthAmount] = useState(0);
  const [workByteString, setWorkByteString] = useState("0x00");
  const [safeCreated, setSafeCreated] = useState(false);
  const [ethSentToSafe, setEthSentToSafe] = useState(false);
  const [transactionsCreated, setSetTransactionsCreated] = useState(false);
  const [isSendingTx, setIsSendingTx] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    // ToDo. Check if addresses are valid.
    setIsSendingTx(true);
    const filteredVoters = evaluators.filter(voter => voter);
    const safeAddress = await deployOracle({
      tx,
      threshold,
      evaluators,
      deployerAddress: address,
      userSigner,
      workString: workByteString,
      ethAmount,
      beneficiary,
      onSafeCreated: () => setSafeCreated(true),
      onEthSent: () => setEthSentToSafe(true),
      onTransactionsCreated: () => setSetTransactionsCreated(true),
    });
    history.push("/evaluator/" + safeAddress);
    setEvaluators([""]);
    form.resetFields();
    setIsSendingTx(false);

    // await tx(writeContracts.QuadraticDiplomacyContract.addMembersWithVotes(filteredVoters, voteAllocation), update => {
    //   if (update && (update.status === "confirmed" || update.status === 1)) {
    //     setEvaluators([""]);
    //     setVoteAllocation(0);
    //     form.resetFields();
    //     setIsSendingTx(false);
    //   } else if (update.error) {
    //     setIsSendingTx(false);
    //   }
    // });
  };

  return (
    <div style={{ border: "1px solid #cccccc", padding: 16, width: 800, margin: "auto", marginTop: 64 }}>
      <Form form={form} name="basic" onFinish={handleSubmit} labelCol={{ span: 8 }} wrapperCol={{ span: 12 }}>
        <Form.Item label="Work to be done" name="workString" style={{ textAlign: "left" }}>
          {/* TODO: Give the user a fitting error message when a message of more then 32bytes is entered  */}
          <BytesStringInput
            autofocus
            placeholder="solve fix language bug (#33)"
            onChange={value => {
              console.log(value);
              setWorkByteString(value);
            }}
          />
          {/* <Input placeholder="ex. 'solve bug #34'" onChange={e => setWorkString(e.target.value)} /> */}
        </Form.Item>
        <Form.Item label="Amount of ether to pay for work" name="ethAmount" style={{ textAlign: "left" }}>
          <EtherInput
            autofocus
            price={price}
            placeholder="ETH value"
            /*
              onChange={v => {
                v = v && v.toString && v.toString()
                if(v){
                  const valueResult = ethers.utils.parseEther(""+v.replace(/\D/g, ""))
                  setValue(valueResult);
                }

              }}*/
            onChange={ethValue => setEthAmount(ethValue)}
          />
        </Form.Item>
        <Form.Item label="Beneficiary Address" name="beneficiary" style={{ textAlign: "left" }}>
          <AddressInput
            autoFocus
            ensProvider={mainnetProvider}
            placeholder="Beneficiary"
            value={beneficiary}
            onChange={address => {
              setBeneficiary(address);
            }}
          />
        </Form.Item>
        <Divider />
        <Title level={3}>Add evaluators</Title>
        {evaluators.map((_, index) => (
          <EvaluatorInput
            key={index}
            index={index}
            setVoters={setEvaluators}
            evaluators={evaluators}
            mainnetProvider={mainnetProvider}
          />
        ))}
        <Divider />
        <Form.Item style={{ justifyContent: "center" }}>
          {/*ToDo. Restart ant form state (the browser is keeping filled-removed elements)*/}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => setEvaluators(prevVoters => [...prevVoters, ""])}
          >
            Add Evaluator
          </Button>
        </Form.Item>
        <Divider />
        <Form.Item label="Threshold" name="voteCredit" style={{ textAlign: "left" }}>
          <Input type="number" onChange={e => setThreshold(e.target.value)} />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 8 }}>
          {/*ToDo Disable if empty members */}
          {!isSendingTx ? (
            <Button
              type="primary"
              htmlType="submit"
              block
              disabled={
                !beneficiary ||
                evaluators.length == 0 ||
                !ethAmount ||
                !workByteString ||
                threshold > evaluators.length ||
                threshold <= 0 ||
                !threshold
              }
            >
              Deploy the results-oracle
            </Button>
          ) : (
            <Spin size="small" />
          )}
        </Form.Item>
      </Form>
      {isSendingTx ? (
        <Steps direction="vertical">
          <Steps.Step status={safeCreated ? "finish" : "process"} title="Deploy Safe" />
          <Steps.Step status={ethSentToSafe ? "finish" : safeCreated ? "process" : "wait"} title="Send ether to safe" />
          <Steps.Step
            status={transactionsCreated ? "finish" : ethSentToSafe ? "process" : "wait"}
            title="Proposing transactions"
          />
        </Steps>
      ) : (
        <></>
      )}
    </div>
  );
}

const EvaluatorInput = ({ index, evaluators, setVoters, mainnetProvider }) => {
  return (
    <>
      <Form.Item label={`Evaluator ${index + 1}`} name={`address[${index}]`} style={{ marginBottom: "5px" }}>
        <Row gutter={8} align="middle">
          <Col flex="auto">
            <AddressInput
              autoFocus
              ensProvider={mainnetProvider}
              placeholder="Enter address"
              value={evaluators[index]}
              onChange={address => {
                setVoters(prevVoters => {
                  const nextVoters = [...prevVoters];
                  nextVoters[index] = address;
                  return nextVoters;
                });
              }}
            />
          </Col>
          <Col>
            <DeleteOutlined
              style={{ cursor: "pointer", color: "#ff6666" }}
              onClick={event => {
                setVoters(prevVoters => {
                  const nextVoters = [...prevVoters];
                  return nextVoters.filter((_, i) => i !== index);
                });
              }}
            />
          </Col>
        </Row>
      </Form.Item>
    </>
  );
};

export default withRouter(OracleDeployerView);
