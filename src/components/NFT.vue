<template>
	<div class="grid">
		<div class="col-12">
			<div class="card">
				<h5>NFT Explorer</h5>
				<ProgressBar v-if="loading" mode="indeterminate"/>
				<Dialog header="Claim ValueLink" v-model:visible="claimDisplay" :breakpoints="{'960px': '75vw'}" :style="{width: '30vw'}" :modal="true">
					<p class="line-height-3 m-0">
						Choose NFT that belongs to you is better. Because you can provide the valid proof for value link easily.
					</p>
					<br />
                    <Dropdown id="dropdown" v-model="valuelinkType" :options="valueLinkOptions" optionValue="value" optionLabel="label" placeholder="Choose ValueLink" @change="onVLChange($event)"/>
					<br />
					<p v-if="valuelinkType" class="line-height-3 m-0">{{ vlDesc[valuelinkType] }}</p>
					<template #footer>
						<Button label="Claim" @click="claim()" icon="pi pi-check" class="p-button-outlined"/>
					</template>
				</Dialog>
				<DataView :value="dataviewValue" :layout="layout" :paginator="true" :rows="9">
					<template #header>
						<div class="grid grid-nogutter">
							<div class="col-6 text-left">
								<Dropdown v-model="categoryKey" :options="categoryOptions" optionValue="value" optionLabel="label" placeholder="Choose NFT" @change="oncategoryChange($event)"/>
                                <Button v-if="categoryKey" style="margin-left: 10px;" class="p-button-secondary" @click="mint()">Mint</Button>
							</div>
							<div class="col-6 text-right">
								<DataViewLayoutOptions v-model="layout" />
							</div>
						</div>
					</template>
					<template #list="slotProps">
						<div class="col-12">
							<div class="flex flex-column md:flex-row align-items-center p-3 w-full">
								<img :src="slotProps.data.image" :alt="slotProps.data.name" class="my-4 md:my-0 w-9 md:w-10rem shadow-2 mr-5" />
								<div class="flex-1 text-center md:text-left">
									<div class="font-bold text-2xl">{{slotProps.data.name}}</div>
									<div class="mb-3">
										<Chip :label="slotProps.data.description" icon="pi pi-link" class="mr-2 mb-2" />
										<Button icon="pi pi-copy" class="p-button-text" v-clipboard:copy="slotProps.data.uri.toString()" v-clipboard:success="onCopy" v-clipboard:error="onError"></Button>
									</div>
									<Rating :modelValue="slotProps.data.rating" :readonly="true" :cancel="false" class="mb-2"></Rating>
									<div class="flex align-items-center">
										<i class="pi pi-tag mr-2"></i>
										<span class="font-semibold">{{slotProps.data.category}}</span>
									</div>

								</div>
								<div class="flex flex-row md:flex-column justify-content-between w-full md:w-auto align-items-center md:align-items-end mt-5 md:mt-0">
									<span class="text-2xl font-semibold mb-2 align-self-center md:align-self-end">${{slotProps.data.price}}</span>
									<Button label="Claim" :disabled="slotProps.data.inventoryStatus === 'OUTOFSTOCK'" class="mb-2" @click="showClaim(slotProps.data)"></Button>
									<span :class="'product-badge status-'+slotProps.data.inventoryStatus.toLowerCase()">{{slotProps.data.inventoryStatus}}</span>
								</div>
							</div>
						</div>
					</template>

					<template #grid="slotProps">
						<div class="col-12 md:col-4">
							<div class="card m-3 border-1 surface-border">
								<div class="flex align-items-center justify-content-between">
									<div class="flex align-items-center">
										<i class="pi pi-tag mr-2"></i>
										<span class="font-semibold">{{slotProps.data.category}}</span>
									</div>
									<span :class="'product-badge status-'+slotProps.data.inventoryStatus.toLowerCase()">{{slotProps.data.inventoryStatus}}</span>
								</div>
								<div class="text-center">
									<img :src="slotProps.data.image" :alt="slotProps.data.name" class="w-9 shadow-2 my-3 mx-0"/>
									<div class="text-2xl font-bold">{{slotProps.data.name}}</div>
									<div class="mb-3" >
										<Chip :label="slotProps.data.description" icon="pi pi-link" class="mr-2 mb-2" />
										<Button icon="pi pi-copy" class="p-button-text" v-clipboard:copy="slotProps.data.uri.toString()" v-clipboard:success="onCopy" v-clipboard:error="onError"></Button>
									</div>
									<Rating :modelValue="slotProps.data.rating" :readonly="true" :cancel="false"></Rating>
								</div>
								<div class="flex align-items-center justify-content-between">
									<span class="text-2xl font-semibold">${{slotProps.data.price}}</span>
									<Button label="Claim" :disabled="slotProps.data.inventoryStatus === 'OUTOFSTOCK'" @click="showClaim(slotProps.data)"></Button>
								</div>
							</div>
						</div>
					</template>
				</DataView>
			</div>
		</div>
	</div>
</template>

<script>
	import NFTUri from "../common/NFTURi"
	import { useContracts } from '../stores/contracts'

	export default {
		data() {
			return {
				dataviewValue: null,
				layout: 'grid',
				categoryKey: null,
				categoryOptions: null,
				valueLinkOptions: null,
				loading: false,
				claimDisplay: false,
				selectedToken: null,
				valuelinkType: null,
				vlDesc: {
					'Authorization': 'Create value link that stands right to use!',
					'Fans': 'Create value link that stands following relationship!'
				},
				contractState: useContracts()
			}
		},
		created() {
			this.categoryOptions = this.contractState.categoryOptions
			this.valueLinkOptions = this.contractState.valueLinkOptions
		},
		methods: {
			async oncategoryChange(choosedItem){
                console.log(choosedItem.value)
				this.dataviewValue = null;
                await this.listNFTs()
			},
            async listNFTs()  {
				const contractWrapper = this.contractState.getContractByName(this.categoryKey)
				console.log(contractWrapper)
                const contract = contractWrapper.signer
				const chainId = this.contractState.network.chainId
				const contractAddress = contractWrapper.address
                const size = await contract.totalSupply()
				this.loading = true
                const list = []
                for (let index = size - 1; index >= 0; index--) {
                    const tokenId = await contract.tokenByIndex(index)
					const nftUri = new NFTUri(chainId, contractAddress, "" + tokenId)
                    list.push({
                        "id": "" + tokenId,
                        "code": "v435nn85n",
                        "name": `${this.categoryKey}#${tokenId}`,
                        "description": nftUri.toSlimString(),
                        "image": `images/nft/${this.categoryKey}/${tokenId}.png`,
                        "price": Math.ceil(Math.random()*10),
                        "category": this.categoryKey,
                        "inventoryStatus": "INSTOCK",
                        "rating": tokenId.toNumber() % 5,
						"uri": nftUri
                    })
                }
                this.dataviewValue = list;
				this.loading = false;
            },
            async mint() {
				const contractWrapper = this.contractState.getContractByName(this.categoryKey)
                const contract = contractWrapper.signer
				console.log('wrapper', contractWrapper, contract)
                console.log('start mint', this.categoryKey)
                const name = await contract.name()
                const total = await contract.totalSupply()
                console.log('minting', name, total.toNumber(), "to", contractWrapper.signerAddress)
                const tx = await contract.mint(contractWrapper.signerAddress)
                this.contractState.provider.once(tx.hash, (tx) => {
                    // Emitted when the transaction has been mined
                    console.log("txed:", tx)
                    this.$toast.add({severity:'info', summary: 'Minted', detail:'' + tx.transactionHash, life: 5000});
                })
                this.$toast.add({severity:'info', summary: 'Minting', detail:'' + tx.hash, life: 5000});
            },
			onVLChange(choosedVL) {
				console.log(choosedVL.value, this.valuelinkType, this.vlDesc[this.valuelinkType])
			},
			showClaim(token) {
				this.selectedToken = token
				this.claimDisplay = true
			},
			async claim() {
				const contractWrapper = this.contractState.getContractByName(this.valuelinkType)
                const contract = contractWrapper.signer
				const name = await contract.name()
                const totalClaims = await contract.totalClaims()
				const uftUri = this.selectedToken.uri
				console.log('start claim', this.valuelinkType, name, totalClaims.toNumber(), uftUri.toString())
				// const withSigner = contract.connect(signer)
				const tx = await contract.claim(uftUri.toString(), 1000)
				this.contractState.provider.once(tx.hash, (tx) => {
                    // Emitted when the transaction has been mined
                    console.log("txed:", tx)
                    this.$toast.add({severity:'info', summary: 'Claimd', detail:'' + tx.transactionHash, life: 5000});
					this.loading = false
                })
                this.$toast.add({severity:'info', summary: 'Claiming', detail:'' + tx.hash, life: 5000});
				this.claimDisplay = false
				this.loading = true

			},
			onCopy(params) {
				console.log('onCopy', params)
			},
			onError(params) {
				console.log('onError', params)
			}
		}
	}
</script>

<style scoped lang="scss">
@import '../assets/demo/badges.scss';
</style>
