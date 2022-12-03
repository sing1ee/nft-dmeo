<template>
	<div class="grid">
		<div class="col-12">
			<div class="card">
				<h5>NFT List</h5>
                <Toast />
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
									<div class="mb-3">{{slotProps.data.description}}</div>
									<Rating :modelValue="slotProps.data.rating" :readonly="true" :cancel="false" class="mb-2"></Rating>
									<div class="flex align-items-center">
										<i class="pi pi-tag mr-2"></i>
										<span class="font-semibold">{{slotProps.data.category}}</span>
									</div>

								</div>
								<div class="flex flex-row md:flex-column justify-content-between w-full md:w-auto align-items-center md:align-items-end mt-5 md:mt-0">
									<span class="text-2xl font-semibold mb-2 align-self-center md:align-self-end">${{slotProps.data.price}}</span>
									<Button icon="pi pi-shopping-cart" label="Add to Cart" :disabled="slotProps.data.inventoryStatus === 'OUTOFSTOCK'" class="mb-2"></Button>
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
									<div class="mb-3">{{slotProps.data.description}}</div>
									<Rating :modelValue="slotProps.data.rating" :readonly="true" :cancel="false"></Rating>
								</div>
								<div class="flex align-items-center justify-content-between">
									<span class="text-2xl font-semibold">${{slotProps.data.price}}</span>
									<Button icon="pi pi-shopping-cart" :disabled="slotProps.data.inventoryStatus === 'OUTOFSTOCK'"></Button>
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
    import NFTService from "../service/NFTService"
    import axios from 'axios'

	export default {
        inject: ['message', 'ethers'],
		data() {
			return {
				dataviewValue: null,
				layout: 'grid',
				categoryKey: null,
				categoryOptions: [
					{label: 'Authorization', value: 'Authorization'},
					{label: 'Fans', value: 'Fans'},
				],
                projects: {
                    Identity: (tokenId) => {
                        return 'https://metadata.kprverse.com/metadata/' + tokenId + '.json'
                    },
                    Art: (tokenId) => {
                        return 'https://genesis.mypinata.cloud/ipfs/QmYxuHhAoLT3gAWaq39RKDFRGKiirsxCgryLgrA44cobV1/' + tokenId
                    }
                }
			}
		},
        nftService: null,
        provider: null,
        nftContracts: null,
		async created() {
            this.nftService = new NFTService()
		},
		async mounted() {
            this.nftContracts = {}
            this.provider = new this.ethers.providers.Web3Provider(window.ethereum)
            for (const opt of this.categoryOptions) {
                const abi = await this.nftService.getNFT(opt.value);
                this.nftContracts[opt.value] = new this.ethers.Contract(this.nftService.getContractAddress(opt.value), abi.abi, this.provider)
                this.nftContracts[opt.value].on("Transfer", (from, to, tokenId, event) => {
                    console.log(from, to, tokenId, event.transactionHash)
                })
            }
		},
		methods: {
			async oncategoryChange(choosedItem){
                console.log(choosedItem.value)
                await this.listNFTs()
			},
            async listNFTs()  {
                const contract = this.nftContracts[this.categoryKey]
                const size = await contract.totalSupply()
                const list = []
                for (let index = size - 1; index >= 0; index--) {
                    const tokenId = await contract.tokenByIndex(index)
                    const projectUri = this.projects[this.categoryKey](tokenId)
                    console.log(projectUri)
                    const resp = await axios.get(projectUri)
                    console.log(resp)
                    list.push({
                        "id": "" + tokenId,
                        "code": "v435nn85n",
                        "name": resp.data.name,
                        "description": resp.data.description | "",
                        "image": resp.data.image,
                        "price": Math.ceil(Math.random()*10),
                        "category": this.categoryKey,
                        "inventoryStatus": "INSTOCK",
                        "rating": tokenId.toNumber() % 5
                    })
                }
                console.log(this.dataviewValue)
                this.dataviewValue = list;
            },
            async mint() {
                const signer = this.provider.getSigner()
                const address = await signer.getAddress()
                const contract = this.nftContracts[this.categoryKey]
                console.log('start mint', this.categoryKey)
                const name = await contract.name()
                const total = await contract.totalSupply()
                console.log('minting', name, total.toNumber(), "to", address)
                const withSigner = contract.connect(signer)
                const tx = await withSigner.mint(address);
                this.provider.once(tx.hash, (tx) => {
                    // Emitted when the transaction has been mined
                    console.log("txed:", tx)
                    this.$toast.add({severity:'info', summary: 'Minted', detail:'' + tx.hash, life: 5000});
                })
                this.$toast.add({severity:'info', summary: 'Minting', detail:'' + tx.hash, life: 5000});
            }
		}
	}
</script>

<style scoped lang="scss">
@import '../assets/demo/badges.scss';
</style>
