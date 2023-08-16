import { utf8ToBytes, toHex } from 'ethereum-cryptography/utils'
import { keccak256 } from 'ethereum-cryptography/keccak'
import { secp256k1 as secp } from 'ethereum-cryptography/secp256k1'
import { v4 as uuidv4 } from 'uuid';

class Block {
  transactionsList = new Array();
  previousHash = '';
  hash = '';
  index = 0;
  dateCreated;

  constructor() {
    this.dateCreated = new Date().toTimeString();
  }

  toHash() {
    const toBytes = utf8ToBytes(
      `${JSON.stringify(this.transactionsList.toString())} + 
      ${JSON.stringify(this.previousHash)} + 
      ${this.index} + 
      ${this.dateCreated}`
    );
    return toHex(keccak256(toBytes));
  }

  addTransaction(transaction = {}) {

    transaction.signed = this.signTransactionData(transaction);

    this.transactionsList.push(transaction);
  }

  signTransactionData(transaction) {

    const privateKey = toHex(secp.utils.randomPrivateKey());

    const hashedData = this.hashTransactionData(transaction.data);

    return secp.sign(hashedData, privateKey);

  }

  hashTransactionData(data) {
    const _dataBytes = utf8ToBytes(`${JSON.stringify(data)}`);
    return toHex(keccak256(_dataBytes));
  }
}

class BlockChain {
  chain;
  dateCreated;

  constructor() {
    this.dateCreated = new Date().toTimeString();
    this.chain = [this.buildStartingBlock()];
  }

  buildStartingBlock() {
    const firstBlock = new Block();
    firstBlock.hash = firstBlock.toHash();
    return firstBlock;
  }

  addBlock(_block) {
    const blockSize = this.chain.length;
    const lastBlock = this.chain[blockSize - 1];
    _block.index = lastBlock.index + 1;
    _block.previousHash = lastBlock.hash;
    _block.hash = _block.toHash();
    this.chain.push(_block);
  }

  mine(transactions, index) {
    let block = this.chain.find(b => b.index === index);
    for (let i = 0; i < transactions.length; i++) {
      block.transactionsList.push(transactions[i]);
    }
  }

  isValid() {
    const blockSize = this.chain.length;
    let valid = true;

    for (let i = blockSize - 1; i > 0; i--) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (previous.hash !== current.previousHash) {
        valid = false;
        break;
      }
    }

    return valid;
  }
}

class Transaction {
  nonce;
  recipient;
  sender;
  value;
  data = new Array();
  signed = new Object();

  constructor(recipient, sender, amount, data) {
    this.nonce = uuidv4();
    this.recipient = recipient;
    this.sender = sender;
    this.value = amount;
    this.data = data;
  }
}

// Implementation

const mestereumChain = new BlockChain();

const davidEthAddress = uuidv4();
const portiaEthAddress = uuidv4();

const block1 = new Block();

const transaction1Block1 = new Transaction(
  portiaEthAddress,
  davidEthAddress,
  200,
  new Array('Project Form')
);

const transaction2Block1 = new Transaction(
  davidEthAddress,
  portiaEthAddress
  ,
  400,
  new Array('enquiry details')
);

block1.addTransaction(transaction1Block1);
block1.addTransaction(transaction2Block1);


mestereumChain.addBlock(block1);


let transactionToAdd = new Transaction('4e0fdf6e-e79d-449e-9976-3067aedf79e0',
  '8356360c-d8ae-4d10-8c7d-ca7f91a5b8e0',
  400,
  ['enquiry details'],
);
transactionToAdd.signed = {
  r: 90980245840577079238215910564603885065506530502836720573561942906431605291043n,
  s: 46945608438770534088120924862011996086074603321063536476900616038618981675173n,
  recovery: 0
};
transactionToAdd.nonce = '43163a39-be3f-4a03-9014-12a1e268805f';

mestereumChain.mine([transactionToAdd], 1);

console.log("Mestereum Chain", mestereumChain.chain)
console.log("Very strong", mestereumChain.isValid())
