import {ethers, BigNumber, utils} from 'ethers'

import { ChainId, Pair, Token, TokenAmount } from '@syrupdrop/swap-sdk'
import JSBI from 'jsbi'

import ERC20_ABI from './ABI/erc20.js'
import PAIR_ABI  from './ABI/pair.js'
import STAKING_ABI from './ABI/stakingRewards.js'

const PAIR_ADDRESS = "0x4CD1b4595eC1Ec2AfD0096aE37FfC7B6cef8CC86"
const STAKING_ADDRESS = "0x7b007401B53f17061F1cea0A5fDb99BC51cD3Ed2"

const provider = new ethers.providers.JsonRpcProvider("https://mainnet.telos.net/evm")

const _1e18 = BigNumber.from("10").pow("18")
const _1e5 = BigNumber.from("10").pow("5")

const pairContract = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, provider)
const erc20PairContract = new ethers.Contract(PAIR_ADDRESS, ERC20_ABI, provider)
const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider)

const elkContract = new ethers.Contract("0xE1C110E1B1b4A1deD0cAf3E42BfBdbB7b5d7cE1C", ERC20_ABI, provider)

const ELKToken = new Token(
  ChainId.TelosEVM_Mainnet,
  "0xE1C110E1B1b4A1deD0cAf3E42BfBdbB7b5d7cE1C",
  18,
  "ELK"
)

const WTLOS = new Token(
  ChainId.TelosEVM_Mainnet,
  "0xD102cE6A4dB07D247fcc28F366A623Df0938CA9E",
  18,
  "WTLOS"
)

async function main() {
    const reserves = await pairContract.getReserves()

    const pair = new Pair(
      new TokenAmount(WTLOS, reserves[0]),
      new TokenAmount(ELKToken, reserves[1]),
      "0x47c3163e691966f8c1b93B308A236DDB3C1C592d"
    )

    const tAmount = pair.getOutputAmount(
      new TokenAmount(WTLOS, ethers.utils.parseEther("2").toBigInt())
    )

    const lpTotalSupply = await erc20PairContract.totalSupply()
    
    const stakingContractBalance = await erc20PairContract.balanceOf(STAKING_ADDRESS)
    
    const tokenAmm = pair.getLiquidityValue(
      WTLOS,
      new TokenAmount(pair.liquidityToken, BigNumber.from(lpTotalSupply).toBigInt()),
      new TokenAmount(pair.liquidityToken, BigNumber.from(stakingContractBalance).toBigInt()),
      false
    )

    const elkTokenValue = pair.getLiquidityValue(
      ELKToken,
      new TokenAmount(pair.liquidityToken, BigNumber.from(lpTotalSupply).toBigInt()),
      new TokenAmount(pair.liquidityToken, BigNumber.from(stakingContractBalance).toBigInt()),
      false
    )
    
    const token1Price = utils.parseEther(pair.token1Price.toSignificant(5))
    const token0Price = utils.parseEther(pair.token0Price.toSignificant(5))
    const tlosAmount = BigNumber.from(tokenAmm.raw.toString()).mul("2")

    let part1 = utils.parseEther("200").mul(token1Price).mul(_1e18)
    let part2 = tlosAmount.mul(token0Price)

    let apr = part1.div(part2).mul("365")

                        apr = apr.mul(token0Price).mul("100").div(_1e18)

    console.log(`
        ${token0Price.toString()}
        ${token1Price.toString()}

        WTLOS Amount: ${utils.formatEther(tlosAmount)}
        ${pair.token1Price.toFixed()}
        ELK Amount: ${elkTokenValue.toSignificant(6)}


        apr: ${utils.formatEther(apr)}
    `)

}
// 2*99507=199014 + 75150=274164
// 2 * 99507 = 199014
// 2 * 54506=109012

main()
/*
(Rate/PoolRate) * Total Deposited = Amount In Chain Token - Then x by Price
(((poolrate*Elkprice)/(TotalTelosStaked*TlosPrice))*365) = x * TlosPrice = x * 100

(200 * 3) / (208700 * 0.3) * 365=3.497844 * 0.3=1.049353 * 100=104.9353
200 * 3=600
208700 * 3=626100=62610=695 666.666667=62610

*/
/**
 *  lp ratio = 57089 / 69132 = 0.825797 
 *  eth holdings =  0.8257985 * 126183= 104201.732126
 *  elk holdings = 0.8 * 38430 = 30744
 */

/**
 * 
 * if (totalSupplyOfStakingToken && stakingTokenPair) {
    // take the total amount of LP tokens staked, multiply by ETH value of all LP tokens, divide by all LP tokens
    valueOfTotalStakedAmountInELK = new TokenAmount(
      elk,
      JSBI.divide(
        JSBI.multiply(
          JSBI.multiply(stakingInfo.totalStakedAmount.raw, stakingTokenPair.reserveOf(elk).raw),
          JSBI.BigInt(2) // this is b/c the value of LP shares are ~double the value of the WETH they entitle owner to
        ),
        totalSupplyOfStakingToken.raw
      )
    )
  }
 */