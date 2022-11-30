require("@nomicfoundation/hardhat-toolbox");

const ethers = require('ethers');
require('dotenv').config()
const encryptWalletJson = require('./master.json');
const wallet = ethers.Wallet.fromEncryptedJsonSync(JSON.stringify(encryptWalletJson), process.env.COMMON_KEY)


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    mumbai: {
      url: process.env.RPC_EVM,
      accounts: [wallet.privateKey]
    }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
};
