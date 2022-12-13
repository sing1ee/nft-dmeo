<template>
	<div class="layout-topbar">
		<router-link to="/" class="layout-topbar-logo">
			<img alt="Logo" :src="topbarImage()" />
			<span>VALUE LINK</span>
		</router-link>
		<button class="p-link layout-menu-button layout-topbar-button" @click="onMenuToggle">
			<i class="pi pi-bars"></i>
		</button>
		
		<button class="p-link layout-topbar-menu-button layout-topbar-button"
			v-styleclass="{ selector: '@next', enterClass: 'hidden', enterActiveClass: 'scalein', 
			leaveToClass: 'hidden', leaveActiveClass: 'fadeout', hideOnOutsideClick: true}">
			<i class="pi pi-ellipsis-v"></i>
		</button>
		<Toast />
		<ul class="layout-topbar-menu hidden lg:flex origin-top">
			<li>
				<Dropdown class="lg:flex origin-top mr-2 mb-2" id="state" v-model="dropdownItem" :options="dropdownItems" optionLabel="name" placeholder="Select One" @change="switchNetwork"></Dropdown>
			</li>
			<li>
				<Button class="lg:flex origin-top mr-2 mb-2" @click="connect()">{{ currentAccount }}</Button>
			</li>
		</ul>
	</div>
</template>

<script>
import { useContracts } from './stores/contracts'
export default {
	data() {
		return {
			dropdownItems: [],
			dropdownItem: null,
			networks: {},
			currentAccount: 'Connect wallet',
			chainId: 'Choose Network',
			contractState: useContracts()
		}
	},
	async created() {
		for (const c of this.contractState.chainIds) {
			this.networks[c.chainId] = c.chainName
		}

		for(const k in this.networks) {
			this.dropdownItems.push({'code': k, 'name': this.networks[k]})
		}
		console.log("wallet connect: ", this.contractState.isConnected)
		if (this.contractState.isConnected) {
			this.chainId = this.contractState.network.chainId
			this.currentAccount = this.contractState.account
		}

	},
    methods: {
        onMenuToggle(event) {
            this.$emit('menu-toggle', event);
        },
		onTopbarMenuToggle(event) {
            this.$emit('topbar-menu-toggle', event);
        },
		topbarImage() {
			return this.$appState.darkTheme ? 'images/logo-white.svg' : 'images/logo-dark.svg';
		},
		handleChainChanged(_chainId) {
			if (_chainId !== '0x13881') {
				this.$toast.add({severity:'warn', summary: 'Network Change', detail:'This demo is only for Mumbai', life: 3000})
			}
			if (_chainId && this.chainId && _chainId !== this.chainId) {
				// We recommend reloading the page, unless you must do otherwise
				this.chainId = _chainId
				console.log(this.chainId,'toast')
				this.dropdownItem = {'code': this.chainId, 'name': this.networks[this.chainId]}
				this.$toast.add({severity:'success', summary: 'Network Change', detail:'Network Change to ' + this.networks[_chainId], life: 3000})
			}
		},
		handleAccountsChanged(accounts) {
			if (accounts.length === 0) {
				this.$toast.add({severity:'success', summary: 'Wallet Change', detail:'Connect Metamask!', life: 3000})
			} else if (accounts[0] !== this.currentAccount) {
				this.currentAccount = accounts[0];
			}
		},
		async connect() {
			if(!this.contractState.isConnected) {
				const metamask = await this.contractState.useMetamask()
				if (!metamask) {
					this.$toast.add({severity:'error', summary: 'Wallet', detail: 'Install metamask', life: 3000})
				} else {
					this.currentAccount = this.contractState.account
					console.log(this.chainId, this.currentAccount)
					this.contractState.ethereum.on('chainChanged', this.handleChainChanged)
					this.contractState.ethereum.on('accountsChanged', this.handleAccountsChanged)
					this.handleChainChanged(this.contractState.network.chainId)
				}
			}
		},
		async switchNetwork() {	
			const code = await this.contractState.switchNetwork(this.dropdownItem.code)
			if (code === 1) {
				this.$toast.add({severity:'warn', summary: 'Network', detail: `Add ${this.networks[this.dropdownItem.code]} First`, life: 3000})
			}
			await this.contractState.useMetamask()
			this.currentAccount = this.contractState.account
			console.log(this.chainId, this.currentAccount)
			this.contractState.ethereum.on('chainChanged', this.handleChainChanged)
			this.contractState.ethereum.on('accountsChanged', this.handleAccountsChanged)
			this.handleChainChanged(this.contractState.network.chainId)
		},
    },
	computed: {
		darkTheme() {
			return this.$appState.darkTheme;
		}
	}
}
</script>