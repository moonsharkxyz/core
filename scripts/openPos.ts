import { toNano } from 'ton-core';
import { Main } from '../wrappers/Main';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const user_contract = await compile('User')
    const position_contract = await compile('Position')
    const board_contract = await compile('Board')
    const strike_contract = await compile('Strike')

    const main = provider.open(Main.createFromConfig({
        user_contract,
        position_contract,
        board_contract,
        strike_contract,
        oracle: provider.sender().address!,
        aaddr: provider.sender().address!,
        jaddr: provider.sender().address!,
    }, await compile('Main')));

    let params = {
        asset_id: 2,
        exp_time: 1692954000,
        strike: 170000000,
        iv: 550,
        skew: 1100,
        ss: 450,
        is_call: true,
        is_long: true,
        q: 1,
        collateral: 100,
        marketPrice: 175000000
    }

    await main.sendOpenPos(provider.sender(), params);
}
