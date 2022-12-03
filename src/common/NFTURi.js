const protocol = 'vlp'

export default class NFTUri {
    constructor(chainId, contractAddress, index) {
        this.chainId = chainId
        this.contractAddress = contractAddress
        this.index = index
    }
    toString() {
        return `${protocol}://${this.chainId}/${this.contractAddress}/${this.index}`
    }
}
