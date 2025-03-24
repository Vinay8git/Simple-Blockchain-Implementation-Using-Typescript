import * as crypto from 'crypto';

class Transaction{
    constructor(
        public amount : number,
        public payer : string,
        public payee : string
    ){}

    toString() {
        return JSON.stringify(this);
    }
}

class Block{

    public nonce = Math.round(Math.random()*999999999);
    constructor(
        public prevHash : string,
        public transactions : Transaction,
        public ts = new Date().toLocaleTimeString()
    ){}

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
    
}

class Chain {
    public static instance = new Chain();

    chain: Block[];

    constructor() {
        this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    mine(nonce: number) {
        let solution = 1;
        console.log('Mining.....');

        while(true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if(attempt.substring(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }

            solution+=1;
        }
    }

    addBlock(transaction: Transaction, senderPublickey: string, signature: Buffer) {
        const verify = crypto.createVerify('SHA256');
        verify.update(transaction.toString());

        const isValid = verify.verify(senderPublickey, signature);
        if(isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);

        }
    }
}

class Wallet {
    public publicKey: string;
    public privateKey: string;

    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {type: 'spki', format: 'pem'},
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey); 
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}

const satoshi = new Wallet();
const lucifer = new Wallet();
const og = new Wallet();

satoshi.sendMoney(100, lucifer.publicKey);
console.log("Transaction between Satoshi and Lucifer Done!");
lucifer.sendMoney(50, og.publicKey);
console.log("Transaction between Lucifer and Og Done!");

console.log(Chain.instance);