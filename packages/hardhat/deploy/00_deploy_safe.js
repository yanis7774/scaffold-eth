// import { EthersAdapter, SafeFactory } from
const { EthersAdapter, SafeFactory } = require("@gnosis.pm/safe-core-sdk");
const { default: SafeServiceClient } = require("@gnosis.pm/safe-service-client");
const { ethers } = require("hardhat");
const config = require("../../../config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const serviceClient = new SafeServiceClient("https://safe-transaction.rinkeby.gnosis.io");
  const deployer = ethers.provider.getSigner();
  const deployerAddress = await deployer.getAddress();
  const ethAdapter = new EthersAdapter({
    ethers,
    signer: deployer,
  });
  console.log(`Deployer is: ${deployerAddress}`);

  const safeFactory = await SafeFactory.create({ ethAdapter });

  const threshold = config.threshold;
  const owners = config.evaluators;
  if (!owners.map(_ => _.toLowerCase()).includes(deployerAddress.toLowerCase())) {
    throw Error(
      `The deployer needs to be one of the signers. Add the deployer (${deployerAddress}) address to the evaluators array in the config (and increase the threshold by one to keep things the same).`,
    );
  }
  const safeAccountConfig = { owners, threshold };
  const safeSdk = await safeFactory.deploySafe(safeAccountConfig);

  const proposeTransactions = async transaction => {
    try {
      console.log("INPUT to safeSdk.createTransaction:")
      console.log(JSON.stringify(transaction))
      const safeTransaction = await safeSdk.createTransaction(transaction);
      await safeSdk.signTransaction(safeTransaction);
      console.log("safeSdk.signTransaction done")
      const txHash = await safeSdk.getTransactionHash(safeTransaction);
      console.log("safeSdk.getTransactionHash is " + txHash)
      console.log("OUTPUT safeTransaction:");
      console.log(JSON.stringify(safeTransaction))

      console.log("INPUT for serviceClient.proposeTransaction:")
      console.log(
        JSON.stringify({
          safeAddress,
          "safeTransaction.data": safeTransaction.data,
          txHash,
          signature: safeTransaction.signatures.get(deployerAddress.toLowerCase()),
        }),
      );

      await serviceClient.proposeTransaction(
        safeAddress,
        safeTransaction.data,
        txHash,
        safeTransaction.signatures.get(deployerAddress.toLowerCase()),
      );
      console.log("transactions sent");
    } catch (e) {
      console.log("Failed to propose transaction:");
      console.log(e);
    }
  };

  const safeAddress = safeSdk.getAddress();
  console.log(`Safe deployed to: ${safeAddress}`);
  console.log(`Signers: ${owners}`);

  try {
    const tx = await deployer.sendTransaction({
      to: safeAddress,
      value: ethers.utils.parseEther(config.ethAmountToSend),
    });

    await tx.wait();

    console.log(`Safe funded with ${config.ethAmountToSend} ETH`);
  } catch (e) {
    console.log(`Ether transfer failed!`);
    console.log(e);
  }

  await proposeTransactions({
    to: ethers.utils.getAddress(config.beneficiary),
    value: ethers.utils.parseEther(config.ethAmountToSend),
    data: "0x",
    nonce: 0,
  });
  // await proposeTransactions({
  //   to: deployerAddress,
  //   value: ethers.utils.parseEther(config.ethAmountToSend),
  //   data: "0x",
  //   nonce: 0,
  // });
  console.log("Transactions for both yes and no case created and proposed via the safe-service-client");
  // const transactions = [
  //   {
  //     to: config.beneficiary,
  //     value: ethers.utils.parseEther(config.ethAmountToSend),
  //     data: ethers.utils.base64.decode("yes"),
  //     nonce: 0
  //   },
  //   {
  //     to: deployerAddress,
  //     value: ethers.utils.parseEther(config.ethAmountToSend),
  //     data: ethers.utils.base64.decode("no"),
  //     nonce: 0
  //   },
  // ];

  // const safeTransaction = await safeSdk.createTransaction(...transactions);
  // await safeSdk.signTransaction(safeTransaction);
  // const txHash = await safeSdk.getTransactionHash(safeTransaction);

  // await serviceClient.proposeTransaction(
  //   safeAddress,
  //   safeTransaction.data,
  //   txHash,
  //   safeTransaction.signatures.get(deployerAddress.toLowerCase()),
  // );

  // console.log("Transactions for both yes and no case created and proposed via the safe-service-client");
};
