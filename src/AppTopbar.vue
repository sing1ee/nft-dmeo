<template>
	<div class="layout-topbar">
		<router-link to="/" class="layout-topbar-logo">
			<img alt="Logo" :src="topbarImage()" />
			<span>SAKAI</span>
		</router-link>
		<button class="p-link layout-menu-button layout-topbar-button" @click="onMenuToggle">
			<i class="pi pi-bars"></i>
		</button>
		
		<button class="p-link layout-topbar-menu-button layout-topbar-button"
			v-styleclass="{ selector: '@next', enterClass: 'hidden', enterActiveClass: 'scalein', 
			leaveToClass: 'hidden', leaveActiveClass: 'fadeout', hideOnOutsideClick: true}">
			<i class="pi pi-ellipsis-v"></i>
		</button>
		
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
export default {
	data() {
		return {
			dropdownItems: [],
			dropdownItem: null,
			networks: {
				'0x5': 'Goerli',
				'0x13881': 'Polygon Mumbai',
				'Current Network': 'Current Network'
			},
			currentAccount: 'Connect wallet',
			chainId: 'Choose Network',
		}
	},
	created() {
		for(const k in this.networks) {
			this.dropdownItems.push({'code': k, 'name': this.networks[k]})
		}
		console.log("wallet connect: ", window.ethereum.isConnected())
		if(!window.ethereum.isConnected()) {
			this.connect()
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
			if (_chainId && this.chainId && _chainId !== this.chainId) {
				// We recommend reloading the page, unless you must do otherwise
				this.chainId = _chainId
				console.log(this.chainId,'toast')
				this.dropdownItem = {'code': this.chainId, 'name': this.networks[this.chainId]}
				this.$toast.add({severity:'success', summary: 'Network Change', detail:'Network Change to ' + this.networks[_chainId], life: 3000})
				// window.location.reload();
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
			if (window.ethereum) {
				window.ethereum.on('chainChanged', this.handleChainChanged)
				window.ethereum.on('accountsChanged', this.handleAccountsChanged)
				const chainId = await window.ethereum.request({
					method: 'eth_chainId'
				});
				this.handleChainChanged(chainId);
				window.ethereum.request({
					method: 'eth_requestAccounts'
				})
				.then(this.handleAccountsChanged)
				.catch((err) => {
							if (err.code === 4001) {
								// EIP-1193 userRejectedRequest error
								// If this happens, the user rejected the connection request.
								this.$toast.add({severity:'error', summary: 'Wallet Change', detail:err.message, life: 3000})
								console.log('Please connect to MetaMask.');
							} else {
								console.error(err);
							}
						})
				} else {
					this.$toast.add({severity:'warn', summary: 'Wallet Info', detail: 'Install Metamask!', life: 3000})
				}
			},
		async switchNetwork() {	
			try {
				await window.ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId:  this.dropdownItem.code}],
				});
			} catch (switchError) {
				// This error code indicates that the chain has not been added to MetaMask.
				if (switchError.code === 4902) {
					this.$toast.add({severity:'error', summary: 'Wallet Info', detail: 'Add network to Metamask!', life: 3000})
				}
			}
		},
    },
	computed: {
		darkTheme() {
			return this.$appState.darkTheme;
		}
	}
}
</script>