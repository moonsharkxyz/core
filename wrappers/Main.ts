import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, parseTuple, Sender, SendMode, Slice, toNano } from 'ton-core';
import { TupleItemSlice } from 'ton-core/dist/tuple/tuple';
import { crc32 } from '../js/crc32';
export type MainConfig = {
    user_contract: Cell;
    position_contract: Cell;
    board_contract: Cell;
    strike_contract: Cell;
    aaddr: Address;
    jaddr: Address;
};
export function mainConfigToCell(config: MainConfig): Cell {
    return beginCell()
        .storeRef(beginCell()
            .storeRef(config.user_contract)
            .storeRef(config.position_contract)
            .storeRef(config.board_contract)
            .storeRef(config.strike_contract)
            .endCell())
        .storeAddress(config.aaddr)
        .storeAddress(config.jaddr)
        .storeUint(0, 64)
        .storeUint(0, 64)
        .storeUint(0, 64)
        .storeUint(0, 64)
        .storeDict()
        .storeRef(beginCell().endCell())
        .endCell();
}
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}
export class Main implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }
    static createFromAddress(address: Address) {
        return new Main(address);
    }
    static createFromConfig(config: MainConfig, code: Cell, workchain = 0) {
        const data = mainConfigToCell(config);
        const init = { code, data };
        return new Main(contractAddress(workchain, init), init);
    }
    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
    async sendAddPosition(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(crc32("open_pos"), 32)
                .storeUint(2, 3)
                .storeUint(1694163600, 64)
                .storeUint(170000000, 64)
                .storeUint(0, 1)
                .storeUint(0, 1)
                .storeUint(1, 64)
                .storeUint(2, 64)
                .storeUint(0, 64)
                .endCell(),
        });
    }
    async sendAddStrike(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(crc32("add_strike"), 32)
                .storeUint(2, 3)
                .storeUint(1694163600, 64)
                .storeUint(170000000, 64)
                .storeUint(1100, 64)
                .endCell(),
        });
    }
    async sendRemoveStrike(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(crc32("remove_strike"), 32)
                .storeUint(2, 3)
                .storeUint(1694163600, 64)
                .storeUint(170000000, 64)
                .endCell(),
        });
    }
    async sendInitBoard(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(crc32("init_board"), 32)
                .storeUint(2, 3)
                .storeUint(1694163600, 64)
                .storeUint(550, 64)
                .endCell(),
        });
    }
    async sendCloseBoard(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(crc32("close_board"), 32)
                .storeUint(2, 3)
                .storeUint(1694163600, 64)
                .endCell(),
        });
    }
    async sendSetJaddr(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(crc32("set_jaddr"), 32)
                .storeAddress(Address.parse(""))
                .endCell(),
        });
    }
    async getUserAddr(provider: ContractProvider, opts: {
        addr: Address
    }): Promise<Address> {
        const result = await provider.get('get_user_addr', [
            {
                type: 'slice',
                cell: beginCell().storeAddress(opts.addr).endCell()
            } as TupleItemSlice
        ]);
        return result.stack.readAddress();
    }
}