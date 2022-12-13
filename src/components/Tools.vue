<template>
	<div class="grid">
		<div class="col-12 md:col-6">
			<div class="card">
				<h5>Networks</h5>
				<Button label="Add Polygon mumbai to Metamask" class="mr-2 mb-2" @click="addNetwork('0x13881')"></Button>
			</div>
		</div>
	</div>
</template>

<script>
	import { useContracts } from '../stores/contracts'
	export default {
		data() {
			return {
				contractState: useContracts(),
				chainIds: {}
			}
		},
		created() {
			for (const c of this.contractState.chainIds) {
				this.chainIds[c.chainId] = c
			}
		},
		methods: {
			addNetwork(chainId) {
				this.contractState.ethereum.request({
					method: 'wallet_addEthereumChain', // Metamask的api名称
					params: [this.chainIds[chainId]]
				})
			},
		}
	}
</script>