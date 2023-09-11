import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, parseTuple, Sender, SendMode, Slice, toNano, TupleBuilder } from 'ton-core';
import { TupleItemSlice } from 'ton-core/dist/tuple/tuple';
import { crc32 } from '../js/crc32';
import { opt_price } from '../js/opt_price';
export type MainConfig = {
    user_contract: Cell;
    position_contract: Cell;
    board_contract: Cell;
    strike_contract: Cell;
    oracle: Address;
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
        .storeAddress(config.oracle)
        .storeAddress(config.aaddr)
        .storeAddress(config.jaddr)
        .storeUint(0, 55)
        .storeUint(0, 55)
        .storeUint(0, 55)
        .storeUint(0, 55)
        .storeDict()
        .storeRef(beginCell().endCell())
        .endCell();
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
    async sendInitBoard(provider: ContractProvider, via: Sender, params: any) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(crc32("init_board"), 32)
                .storeUint(params.asset_id, 3)
                .storeUint(params.exp_time, 64)
                .storeUint(params.iv, 64)
                .storeUint(params.ss, 64)
                .endCell(),
        });
    }
    async sendAddStrike(provider: ContractProvider, via: Sender, params: any) {
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(crc32("add_strike"), 32)
                .storeUint(params.asset_id, 3)
                .storeUint(params.exp_time, 64)
                .storeUint(params.strike, 64)
                .storeUint(params.skew, 64)
                .endCell(),
        });
    }
    async sendRemoveStrike(provider: ContractProvider, via: Sender, params: any) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(crc32("remove_strike"), 32)
                .storeUint(params.asset_id, 3)
                .storeUint(params.exp_time, 64)
                .storeUint(params.strike, 64)
                .endCell(),
        });
    }

    async sendCloseBoard(provider: ContractProvider, via: Sender, params: any) {
        await provider.internal(via, {
            value: toNano('0.15'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(crc32("close_board"), 32)
                .storeUint(params.asset_id, 3)
                .storeUint(params.exp_time, 64)
                .endCell(),
        });
    }
    async sendOpenPos(provider: ContractProvider, via: Sender, params: any) {
        console.log(params.is_long ? Math.floor(opt_price(params.exp_time, params.marketPrice, params.strike, params.iv, params.skew, params.is_call, params.is_long) * params.q ) : params.collateral)
        await provider.internal(via, {
            value: toNano('0.3'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x7362d09c, 32)
                .storeUint(0, 64)
                .storeCoins(params.is_long ? Math.floor(opt_price(params.exp_time, params.marketPrice, params.strike, params.iv, params.skew, params.is_call, params.is_long) * params.q ) : params.collateral)
                .storeAddress(via.address)
                .storeUint(params.asset_id, 3)
                .storeUint(params.exp_time, 64)
                .storeUint(params.strike, 64)
                .storeBit(params.is_call)
                .storeBit(params.is_long)
                .storeUint(params.q, 64)
                .storeUint(params.collateral, 64)
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
    async sendSetOracle(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(crc32("set_oracle"), 32)
                .storeAddress(Address.parse(""))
                .endCell(),
        });
    }
    async getBoards(provider: ContractProvider) {
        return await provider.get("get_live_boards", []);
    }
    async getCalcOptPrice(provider: ContractProvider, argss: any) :Promise<any> {
        return await provider.get("calc_opt_price", argss);
    }
    async getUserAddr(provider: ContractProvider, via: Sender) {
        let args = new TupleBuilder();
        args.writeAddress(via.address)
        return await provider.get("get_user_address", args.build());
    }
}