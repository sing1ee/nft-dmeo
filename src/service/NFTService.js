export default class NFTService {

    async getNFT(name) {
		return fetch("data/"+name+".json").then(res => res.json());
	}
	async getContractAddress(name) {
		return fetch("data/contracts.json").then(res => res.json()).then(d => d[name]);
	}
}