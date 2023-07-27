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
        aaddr: provider.sender().address!,
        jaddr: provider.sender().address!,
    }, await compile('Main')));
    await main.sendRemoveStrike(provider.sender());
}
