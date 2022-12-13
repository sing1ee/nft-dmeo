<template>
	<div class="grid">
		<div class="col-12 md:col-6">
			<div class="card">
				<h5>Networks</h5>
				<Button label="Add Polygon mumbai to Metamask" class="mr-2 mb-2" @click="addNetwork('0x13881')"></Button>
				<Button label="Add BSC to Metamask" class="mr-2 mb-2" @click="addNetwork('0x38')"></Button>
				<Button label="Add Maas - TestNet to Metamask" class="mr-2 mb-2" @click="addNetwork('0x440')"></Button>
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
			async addNetwork(chainId) {
				const code = await this.contractState.addNetwork(chainId)
				if (code === 1) {
					this.$toast.add({severity:'warn', summary: 'Network', detail:'duplicated chainId', life: 5000});
				}
			},
		}
	}
</script>