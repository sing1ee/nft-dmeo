import * as ethers from 'ethers'
import { defineStore } from 'pinia'
import detectEthereumProvider from '@metamask/detect-provider'
import FansAbi from '../abi/Fans.json'
import AuthorizationAbi from '../abi/Authorization.json'
import IdentityAbi from '../abi/Identity.json'
import ArtAbi from '../abi/Art.json'
import KeyAddress from '../abi/contracts.json'

export const useContracts = defineStore('contracts', {

    state: () => ({
        account: null,
        network: {
            chainId: null,
        },
        abis: {
            'Fans': FansAbi,
            'Authorization': AuthorizationAbi,
            'Identity': IdentityAbi,
            'Art': ArtAbi,
        },
        nameAddress: null
    }),
    getters: {
        isConnected: state => state.account ? true : false,
        ethereum() {
            return window.ethereum
        },
        provider() {
            return new ethers.providers.Web3Provider(this.ethereum)
        },
        addressName(state) {
            return (address) => {
                for (let name in state.nameAddress) {
                    if (state.nameAddress[name] === address) {
                        return name
                    }
                }
                return ''
            }
        },
        getContractByName(state) {
            return (name) => {
                console.log('getContractByName', name, state.nameAddress[name], state.abis[name])
                const signer = this.provider.getSigner()
                const contract = new ethers.Contract(state.nameAddress[name], state.abis[name].abi, signer)
                const withSigner = contract.connect(signer)
                return {'signer': withSigner, 'signerAddress': state.account, 'address': state.nameAddress[name], 'name': name}
            }
        },
        getContractByAddress(state) {
            return (address) => {
                console.log('getContractByAddress', address, state.addressName(address), state.abis[state.addressName(address)])
                const signer = this.provider.getSigner()
                const contract = new ethers.Contract(address, state.abis[state.addressName(address)].abi, signer)
                const withSigner = contract.connect(signer)
                return {'signer': withSigner, 'signerAddress': state.account, 'address': address, 'name': name}
            }
        },
        categoryOptions() { 
            return [
                {label: 'Identity', value: 'Identity'},
                {label: 'Art', value: 'Art'},
            ]
        },
        valueLinkOptions() { 
            return [
                {label: 'Authorization', value: 'Authorization'},
                {label: 'Fans', value: 'Fans'},
            ]
        }
    },
    actions: {
        async initialize() {
            const chainId = await this.ethereum.request({ method: 'eth_chainId' });
            this.network.chainId = chainId;
        },
        async switchNetwork(chainId) {	
			try {
				await this.ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId:  chainId}],
				});
                return 0
			} catch (switchError) {
				// This error code indicates that the chain has not been added to MetaMask.
				if (switchError.code === 4902) {
                    return 1
				}
                return 2
			}
		},
        async useMetamask() {
            this.nameAddress = KeyAddress
            const provider = await detectEthereumProvider();
            if (provider && provider == this.ethereum) {
                const accounts = await this.ethereum.request({ method: 'eth_requestAccounts' });
                const chainId = await this.ethereum.request({ method: 'eth_chainId' });
                const signer = this.provider.getSigner(accounts[0]);
                const signature = await signer.signMessage(accounts[0]);
                console.log(signature)
                this.account = accounts[0];
                this.network.chainId = chainId;
                return true
            } else {
                return false
            }
        },
    },
})