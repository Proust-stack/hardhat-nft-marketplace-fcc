const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Unit Tests", function () {
          let nftMarketplace, nftMarketplaceContract, basicNft, basicNftContract, user, deployer
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0
          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              user = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplaceContract = await ethers.getContract("NFTMarketplace")
              nftMarketplace = await nftMarketplaceContract.connect(deployer)
              basicNftContract = await ethers.getContract("BasicNft")
              basicNft = await basicNftContract.connect(deployer)
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          })
          describe("listItem", function () {
              it("Emits an event after listing an item", async () => {
                  expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      "ItemListed"
                  )
              })
              it("Exclusively lists en item that have NOt been listed yet", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const error = `NFTMarketplace__AlreadyListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(error)
              })
              it("Exclusively allows owner to list items", async () => {
                  nftMarketplace = await nftMarketplace.connect(user)
                  await basicNft.approve(nftMarketplace.address, TOKEN_ID)
                  const error = `NFTMarketplace__NotOwner()`
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(error)
              })
              it("Need approvals to list items", async () => {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NFTMarketplace__NotApprovedForMarketplace")
              })
              it("Updates listing with seller and price", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listing.price.toString() == PRICE.toString())
                  assert(listing.seller.toString() == deployer.address)
              })
          })
          describe("cancelListing", () => {
              it("Reverts if there is NO listing", async () => {
                  const error = `NFTMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(error)
              })
              it("Reverts if NOT owner tries to call this function", async () => {
                  nftMarketplace = await nftMarketplaceContract.connect(user)
                  await basicNft.approve(nftMarketplace.address, TOKEN_ID)
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NFTMarketplace__NotOwner()")
              })
              it("Emits event and removes listing", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                      "ItemCanceled"
                  )
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listing.price.toString() == "0")
              })
          })
          describe("buyItem", () => {
              it("Reverts if the item is NOT listed", async () => {
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NFTMarketplace__NotListed")
              })
              it("Reverts if the price is NOT met", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NFTMarketplace__PriceNotMet")
              })
              it("Transfers the NFT to the buyer and updates internal proceeds record", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  expect(
                      await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  ).to.emit("ItemBought")
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftMarketplace.getProceeds(deployer.address)
                  assert(newOwner.toString() == user.address)
                  assert(deployerProceeds.toString() == PRICE.toString())
              })
          })
          describe("updateListing", () => {
              it("Must be owner and listed", async () => {
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NFTMarketplace__NotListed")
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NFTMarketplace__NotOwner")
              })
              it("Updates the price of the item", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const newPrice = ethers.utils.parseEther("0.2")
                  nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listing.price.toString() == newPrice.toString())
              })
          })
          describe("withdrawProceeds", () => {
              it("Does NOT allow 0 proceed withdraws", async () => {
                  await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
                      "NFTMarketplace__NotProceeds"
                  )
              })
              it("Withdraws proceeds", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  nftMarketplace = nftMarketplaceContract.connect(deployer)

                  const deployerProceedsBefore = await nftMarketplace.getProceeds(deployer.address)
                  const deployerBalanceBefore = await deployer.getBalance()
                  const txResponse = await nftMarketplace.withdrawProceeds()
                  const transactionReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const deployerBalanceAfter = await deployer.getBalance()
                  assert(
                      deployerBalanceAfter.add(gasCost).toString() ==
                          deployerBalanceBefore.add(deployerProceedsBefore).toString()
                  )
              })
          })
      })
