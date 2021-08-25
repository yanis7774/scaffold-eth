// import { EthersAdapter, SafeFactory } from
const { EthersAdapter, SafeFactory } = require("@gnosis.pm/safe-core-sdk");
const { default: SafeServiceClient } = require("@gnosis.pm/safe-service-client");
const { ethers } = require("hardhat");
const config = require("../../../config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const serviceClient = new SafeServiceClient("https://safe-transaction.rinkeby.gnosis.io/");
  const deployer = ethers.provider.getSigner();
  const deployerAddress = await deployer.getAddress();
  const ethAdapter = new EthersAdapter({
    ethers,
    signer: deployer,
  });
  console.log(`Deployer is: ${deployerAddress}`);

  const safeFactory = await SafeFactory.create({ ethAdapter });

  let threshold = config.threshold;
  const owners = config.evaluators;
  if (!owners.includes(deployerAddress)) {
    console.log(`The deployer address is not set as one of the signers.`);
    console.log(
      `WARNING!: The deployer address is automatically added to the set of evaluators/signers and the threshold is increased by one!`,
    );
    owners.push(deployerAddress);
    threshold += 1;
  }
  const safeAccountConfig = { owners, threshold };
  const safeSdk = await safeFactory.deploySafe(safeAccountConfig);

  const proposeTransactions = async transactions => {
    const safeTransaction = await safeSdk.createTransaction(...transactions);
    await safeSdk.signTransaction(safeTransaction);
    const txHash = await safeSdk.getTransactionHash(safeTransaction);

    await serviceClient.proposeTransaction(
      safeAddress,
      safeTransaction.data,
      txHash,
      safeTransaction.signatures.get(deployerAddress.toLowerCase()),
    );
    console.log(`proposeTransaction done`);
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

  await proposeTransactions([
    {
      to: config.beneficiary,
      value: ethers.utils.parseEther(config.ethAmountToSend),
      data: ethers.utils.base64.decode("yes"),
      nonce: 0,
    },
  ]);
  await proposeTransactions([
    {
      to: config.beneficiary,
      value: ethers.utils.parseEther(config.ethAmountToSend),
      data: ethers.utils.base64.decode("no"),
      nonce: 0,
    },
  ]);
  console.log("Transactions for both yes and no case created and proposed via the safe-service-client");
};
