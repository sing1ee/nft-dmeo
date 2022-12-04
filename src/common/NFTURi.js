const protocol = 'vlp'

export default class NFTUri {

    constructor(chainId, contractAddress, index) {
        this.chainId = chainId
        this.contractAddress = contractAddress
        this.index = index
    }

    chainId() {
        return this.chainId
    }
    contractAddress() {
        return this.contractAddress
    }
    index() {
        return this.index
    }

    static parse(nftUri) {
        const words = nftUri.split('/')
        // words.length === 5
        if (words.length !== 5) {
            throw 'Wrong format, should be vlp://chainId/contractAddress/index'
        }
        if (words[0] !== `${protocol}:`) {
            throw 'Wrong protocol, should start with vlp:'
        }
        return new NFTUri(words[2], words[3], words[4])
    }

    toString() {
        return `${protocol}://${this.chainId}/${this.contractAddress}/${this.index}`
    }

    toSlimString() {
        const part1 = this.contractAddress.substring(0, 7)
        const part2 = this.contractAddress.substring(this.contractAddress.length - 5, this.contractAddress.length)
        return `${protocol}://${this.chainId}/${part1}...${part2}/${this.index}`
    }
}
